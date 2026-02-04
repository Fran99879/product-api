import type { Request, Response, NextFunction } from 'express'
import type { ProductModel, Product } from '../types/product.ts'

export const canEditProduct = (productModel: ProductModel) => {
  return async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
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
