import type { Request, Response } from 'express'
import { z } from 'zod'
import { UserMongo } from '../../models/mongo/user/user.js'
import { MongoOrderModel } from '../../models/mongo/order/order.mongo.js'
import { AppError } from '../../errors/appError.js'
import { ENV } from '../../config/env.js'
import { mpPreference, mpPayment, validateMpToken } from '../../config/mercadopago.js'
import { sendOrderStatusEmail } from '../../emails/order-status.email.js'
import { logger } from '../../lib/logger.js'

const connectSchema = z.object({
  accessToken: z.string().min(20, 'El Access Token no parece válido'),
})

/** Primera URL de CLIENT_URLS, sin barra final: base del frontend para back_urls. */
const frontBase = () => ENV.CLIENT_URLS.split(',')[0]!.trim().replace(/\/$/, '')

/** Marca una orden como pagada (best-effort en el email). */
async function markOrderPaid(orderId: string) {
  const updated = await MongoOrderModel.updateStatus(orderId, 'paid')
  if (updated) {
    void sendOrderStatusEmail(updated).catch((err) =>
      logger.error({ err, orderId }, 'order status email failed')
    )
  }
  return updated
}

/** Carga el token de MP del vendedor dueño de la orden (o lanza AppError claro). */
async function getSellerTokenForOrder(order: {
  items: { product: { owner: string } }[]
}): Promise<{ sellerId: string; token: string }> {
  const owners = [...new Set(order.items.map((i) => i.product.owner).filter(Boolean))]

  if (owners.length === 0) {
    throw new AppError('La orden no tiene un vendedor válido', 400)
  }
  if (owners.length > 1) {
    // El checkout separa el carrito por vendedor; una orden = un vendedor.
    throw new AppError('La orden tiene productos de más de un vendedor', 400)
  }

  const sellerId = owners[0]!
  const seller = await UserMongo.findById(sellerId).select('+mpAccessToken')
  const token = seller?.get('mpAccessToken') as string | undefined

  if (!token) {
    throw new AppError('El vendedor todavía no configuró Mercado Pago', 409)
  }
  return { sellerId, token }
}

// ---------------------------------------------------------------------------
// Conexión del vendedor (token manual)
// ---------------------------------------------------------------------------

const getConnection = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const user = await UserMongo.findById(req.user.id).select('+mpAccessToken')
  res.json({ connected: Boolean(user?.get('mpAccessToken')) })
}

const connect = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401)

  const parsed = connectSchema.safeParse(req.body)
  if (!parsed.success) throw new AppError('Access Token inválido', 400)

  const { accessToken } = parsed.data

  const valid = await validateMpToken(accessToken)
  if (!valid) {
    throw new AppError('El Access Token no es válido o no está activo en Mercado Pago', 400)
  }

  await UserMongo.findByIdAndUpdate(req.user.id, { mpAccessToken: accessToken })
  res.json({ connected: true })
}

const disconnect = async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  await UserMongo.findByIdAndUpdate(req.user.id, { $unset: { mpAccessToken: 1 } })
  res.json({ connected: false })
}

// ---------------------------------------------------------------------------
// Checkout: crear preferencia de pago para una orden
// ---------------------------------------------------------------------------

const createPreference = async (req: Request<{ id: string }>, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const { id } = req.params

  const order = await MongoOrderModel.getById(id)
  if (!order) throw new AppError('Orden no encontrada', 404)
  if (order.buyer.id !== req.user.id) throw new AppError('Forbidden', 403)
  if (order.status !== 'pending') {
    throw new AppError('La orden no está pendiente de pago', 400)
  }

  const { token } = await getSellerTokenForOrder(order)

  const items = order.items.map((i) => ({
    id: i.product.id,
    title: `${i.product.brand ?? ''} ${i.product.name ?? ''}`.trim() || 'Producto',
    quantity: i.quantity,
    unit_price: i.price,
    currency_id: 'ARS',
  }))

  const back = frontBase()
  const resultUrl = `${back}/checkout/resultado?order=${order.id}`
  const isHttps = back.startsWith('https')

  const preference = await mpPreference(token).create({
    body: {
      items,
      external_reference: order.id,
      back_urls: { success: resultUrl, failure: resultUrl, pending: resultUrl },
      // auto_return exige back_urls https válidas; en local (http) se omite.
      ...(isHttps ? { auto_return: 'approved' } : {}),
      ...(ENV.API_PUBLIC_URL
        ? {
            notification_url: `${ENV.API_PUBLIC_URL}/payments/webhook?orderId=${order.id}`,
          }
        : {}),
    },
  })

  res.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  })
}

// ---------------------------------------------------------------------------
// Confirmación al volver de MP (funciona en local sin webhook)
// ---------------------------------------------------------------------------

const confirmPayment = async (req: Request<{ id: string }>, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const { id } = req.params

  const order = await MongoOrderModel.getById(id)
  if (!order) throw new AppError('Orden no encontrada', 404)
  if (order.buyer.id !== req.user.id) throw new AppError('Forbidden', 403)

  if (order.status === 'paid') {
    return res.json({ status: 'paid' })
  }

  const paymentId =
    (req.body?.paymentId as string | undefined) ??
    (req.query.payment_id as string | undefined)

  if (!paymentId) {
    return res.json({ status: order.status })
  }

  const { token } = await getSellerTokenForOrder(order)

  const payment = await mpPayment(token).get({ id: paymentId })

  if (payment.status === 'approved' && payment.external_reference === order.id) {
    const updated = await markOrderPaid(order.id)
    return res.json({ status: updated?.status ?? 'paid' })
  }

  res.json({ status: order.status, paymentStatus: payment.status })
}

// ---------------------------------------------------------------------------
// Webhook de Mercado Pago (notificaciones automáticas de pago)
// ---------------------------------------------------------------------------

const webhook = async (req: Request, res: Response) => {
  // Siempre responder 200 rápido para que MP no reintente en loop.
  res.sendStatus(200)

  try {
    const orderId = req.query.orderId as string | undefined
    const type = (req.body?.type ?? req.query.type) as string | undefined
    const dataId =
      (req.body?.data?.id as string | undefined) ??
      (req.query['data.id'] as string | undefined)

    if (type !== 'payment' || !orderId || !dataId) return

    const order = await MongoOrderModel.getById(orderId)
    if (!order || order.status === 'paid') return

    const { token } = await getSellerTokenForOrder(order)
    const payment = await mpPayment(token).get({ id: dataId })

    if (payment.status === 'approved' && payment.external_reference === order.id) {
      await markOrderPaid(order.id)
      logger.info({ orderId }, 'order marked paid via MP webhook')
    }
  } catch (err) {
    logger.error({ err }, 'mercadopago webhook failed')
  }
}

export const paymentsController = {
  getConnection,
  connect,
  disconnect,
  createPreference,
  confirmPayment,
  webhook,
}
