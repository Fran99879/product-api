import type { Request, Response } from 'express'
import { validateCreateOrder, validateUpdateOrder } from '../../schemas/order.schema.js'
import type { OrderModel } from '../../models/order.model.js'
import { AppError } from '../../errors/appError.js'

export const createOrderController = ({ orderModel }: { orderModel: OrderModel }) => {
  const getAll = async (req: Request, res: Response) => {
    const q = req.query as Record<string, string | undefined>
    const role = q.role as 'admin' | 'seller' | 'user' | undefined
    const userId = q.userId
    const orders = await orderModel.getAll({ role, userId })
    res.json(orders)
  }

  const getById = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params
    if (!id || typeof id !== 'string') throw new AppError('Invalid id', 400)
    const order = await orderModel.getById(id)
    if (!order) throw new AppError('Order not found', 404)
    res.json(order)
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
    if (!req.user) throw new AppError('Unauthorized', 401)
    const parsed = validateCreateOrder(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues })

    try {
      const created = await orderModel.create({ ...parsed.data, buyer: req.user.id })
      res.status(201).json(created)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order'
      throw new AppError(message, 400)
    }
  }

  const update = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params
    if (!id || typeof id !== 'string') throw new AppError('Invalid id', 400)

    const parsed = validateUpdateOrder(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.issues })

    try {
      const updated = await orderModel.update(id, parsed.data)
      if (!updated) throw new AppError('Order not found', 404)
      res.json(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update order'
      throw new AppError(message, 400)
    }
  }

  const remove = async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const { id } = req.params as { id: string }
    if (!id || typeof id !== 'string') throw new AppError('Invalid id', 400)

    const order = await orderModel.getById(id)
    if (!order) throw new AppError('Order not found', 404)
    if (order.buyer !== req.user.id) throw new AppError('You can only delete your own orders', 403)

    const deleted = await orderModel.delete(id)
    if (!deleted) throw new AppError('Failed to delete order', 400)

    res.json({ message: 'Order deleted' })
  }

  return { getAll, getById, getMyOrders, getSellerOrders, create, update, remove }
}
