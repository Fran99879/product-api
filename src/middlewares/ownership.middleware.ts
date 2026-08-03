import type { Request, Response, NextFunction } from 'express'
import type { ProductModel } from '../models/product.model.js'
import type { OrderModel } from '../models/order.model.js'
import { AppError } from '../errors/appError.js'

export const canEditProduct = (productModel: ProductModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id } = req.params
    const user = req.user

    if (!user) {
      return next(new AppError('Unauthorized', 401))
    }

    const product = await productModel.getById({ id })

    if (!product) {
      return next(new AppError('Product not found', 404))
    }

    if (product.owner !== user.id && user.role !== 'admin') {
      return next(new AppError('Forbidden', 403))
    }

    req.product = product
    next()
  }
}

export const canCancelOrder = (orderModel: OrderModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return next(new AppError('Unauthorized', 401))
    }

    const order = await orderModel.getById(req.params.id)

    if (!order) {
      return next(new AppError('Order not found', 404))
    }

    if (order.buyer.toString() !== user.id && user.role !== 'admin') {
      return next(new AppError('Forbidden', 403))
    }

    req.order = order
    next()
  }
}

export const canUpdateOrderAddress = (orderModel: OrderModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return next(new AppError('Unauthorized', 401))
    }

    const order = await orderModel.getById(req.params.id)

    if (!order) {
      return next(new AppError('Order not found', 404))
    }

    if (order.buyer.toString() !== user.id && user.role !== 'admin') {
      return next(new AppError('Forbidden', 403))
    }

    req.order = order
    next()
  }
}

export const canUpdateOrderStatus = (orderModel: OrderModel) => {
  return async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return next(new AppError('Unauthorized', 401))
    }

    const order = await orderModel.getById(req.params.id)

    if (!order) {
      return next(new AppError('Order not found', 404))
    }

    const isSeller = order.items.some((item) => item.product.owner === user.id)

    if (!isSeller && user.role !== 'admin') {
      return next(new AppError('Forbidden', 403))
    }

    req.order = order
    next()
  }
}
