import type { Request, Response } from 'express'
import { validateOrder, parseUpdateOrder } from '../../schemas/order.js'
import type { ZodError } from 'zod'
import type { OrderModel } from '../../models/order.model.js'
import type { AuthenticatedRequest } from '../../types/request.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { AppError } from '../../errors/appError.js'

export class OrderController {
  constructor (private readonly orderModel: OrderModel) {}

  getAll = async (req: Request, res: Response) => {
    const orders = await this.orderModel.getAll({
      role: 'admin'
    })
    res.json(orders)
  }

  getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
    const orders = await this.orderModel.getByUser({
      userId: req.user.id
    })
    res.json(orders)
  }

  getSellerOrders = async (req: AuthenticatedRequest, res: Response) => {
    const orders = await this.orderModel.getSellerOrders({
      sellerId: req.user.id
    })
    res.json(orders)
  }

  getById = async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid id', 400)
    }

    const order = await this.orderModel.getById({ id })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    res.json(order)
  }

  create = async (req: AuthenticatedRequest, res: Response) => {
    const result = validateOrder(req.body)

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues
      })
    }

    try {
      const newOrder = await this.orderModel.create({
        input: {
          ...result.data,
          buyer: req.user.id
        }
      })

      res.status(201).json(newOrder)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order'
      throw new AppError(message, 400)
    }
  }

  update = asyncHandler(async (req: Request<{ id: string }, unknown, unknown>, res: Response) => {
    const { id } = (req as Request<{ id: string }>).params

    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid id', 400)
    }

    let dto
    try {
      dto = parseUpdateOrder(req.body)
    } catch (err) {
      const zErr = err as ZodError
      if (zErr && Array.isArray((zErr as any).issues)) {
        return res.status(400).json({ errors: (zErr as any).issues })
      }
      return res.status(400).json({ message: err instanceof Error ? err.message : String(err) })
    }

    try {
      const updated = await this.orderModel.update({
        id,
        input: dto
      })

      if (!updated) {
        throw new AppError('Order not found', 404)
      }

      res.json(updated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update order'
      throw new AppError(message, 400)
    }
  })

  delete = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = (req as Request<{ id: string }>).params

    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid id', 400)
    }

    // Verify user owns this order before deletion
    const order = await this.orderModel.getById({ id })
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    if (order.buyer !== req.user.id) {
      throw new AppError('You can only delete your own orders', 403)
    }

    const deleted = await this.orderModel.delete({ id })

    if (!deleted) {
      throw new AppError('Failed to delete order', 404)
    }

    res.json({ message: 'Order deleted successfully' })
  }
}

export default OrderController
