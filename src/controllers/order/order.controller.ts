import type { Request, Response } from 'express'
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
  if (!req.user) throw new AppError('Unauthorized', 401)
  const user = req.user
  const { id } = req.params
  if (!id) throw new AppError('Invalid order id', 400)
  const order = await orderModel.getById(id)
  if (!order) throw new AppError('Order not found', 404)
  if (
    user.role === 'admin' ||
    order.buyer === user.id ||
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

  const update = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params
  if ('status' in req.body && req.user!.role !== 'admin') {
    throw new AppError('You cannot change order status', 403)
  }
  const updated = await orderModel.update(id, req.body)
  if (!updated) throw new AppError('Order not found', 404)
  return res.json(updated)
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
  