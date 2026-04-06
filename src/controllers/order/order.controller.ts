import type { Request, Response } from 'express'
import type { OrderModel } from '../../models/order.model.js'
import { AppError } from '../../errors/appError.js'
import { updateOrderStatusSchema } from '../../schemas/order.schema.js'

export const createOrderController = ({ orderModel }: { orderModel: OrderModel }) => {
  const getAll = async (req: Request, res: Response) => {
    const q = req.query as Record<string, string | undefined>
    const role = q.role as 'admin' | 'seller' | 'user' | undefined
    const userId = q.userId
    const orders = await orderModel.getAll({ role, userId })
    res.json(orders)
  }

  const getById = async (req: Request<{ id: string }>, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const user = req.user
  const { id } = req.params
  if (!id) throw new AppError('Invalid order id', 400)
  const order = await orderModel.getById(id)
  if (!order) throw new AppError('Order not found', 404)
  if (
    user.role === 'admin' ||
    order.buyer.id === user.id ||
    order.items.some(item => item.product.owner === user.id)
  ) {
    return res.json(order)
  }

  throw new AppError('Forbidden', 403)
}

  const getMyOrders = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const orders = await orderModel.getByUser(req.user.id)
    res.json(orders)
  }

  const getSellerOrders = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const orders = await orderModel.getSellerOrders(req.user.id)
    res.json(orders)
  }

  const create = async (req: Request, res: Response) => {
    const created = await orderModel.create({ ...req.body, buyer: req.user!.id })
    res.status(201).json(created)
  }

 const cancel = async (req: Request<{ id: string }>, res: Response) => {
  const updated = await orderModel.cancel(req.order!.id)

  if (!updated) {
    throw new AppError('Order not found', 404)
  }

  return res.json(updated)
}

const updateStatus = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const result = updateOrderStatusSchema.safeParse(req.body)

  if (!result.success) {
    throw new AppError('Invalid status', 400)
  }

  const { status } = result.data

  const updated = await orderModel.updateStatus(
    req.order!.id,
    status
  )

  if (!updated) {
    throw new AppError('Order not found', 404)
  }

  return res.json(updated)
}

const updateAddress = async (req: Request<{ id: string }>, res: Response) => {
  const { address } = req.body

  const updated = await orderModel.update(req.order!.id, { address })

  return res.json(updated)
}

  return {
  getAll,
  getById,
  getMyOrders,
  getSellerOrders,
  create,
  cancel,
  updateStatus,
  updateAddress
}
}
  