import type { Request, Response, NextFunction } from 'express'
import type { ProductModel } from '../models/product.model.js'
import type { OrderModel } from '../models/order.model.js'
import type { Product } from '../schemas/product.js'
import type { Order } from '../schemas/order.schema.js'

export const canEditProduct = (productModel: ProductModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id } = req.params
    const user = req.user

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const product = await productModel.getById({ id })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    if (product.owner !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' })
    }

    req.product = product
    next()
  }
}

export const canCancelOrder = (orderModel: OrderModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const order = await orderModel.getById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.buyer.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    req.order = order
    next()
  }
}

export const canUpdateOrderAddress = (orderModel: OrderModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const order = await orderModel.getById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.buyer.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    req.order = order
    next()
  }
}

export const canUpdateOrderStatus = (orderModel: OrderModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const order = await orderModel.getById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const isSeller = order.items.some((item) => item.product.owner === user.id)

    if (!isSeller && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    req.order = order
    next()
  }
}
