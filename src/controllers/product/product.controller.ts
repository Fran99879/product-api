import type { Request, Response } from 'express'
import type { ProductModel } from '../../models/product.model.js'
import type { ProductQuery } from '../../schemas/product.js'
import { AppError } from '../../errors/appError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

export class ProductController {
  constructor(private readonly productModel: ProductModel) {}

  getAll = async (req: Request, res: Response) => {
    // Validada y coercionada por validateSchema(productQuerySchema, 'query')
    const result = await this.productModel.getAll({
      query: req.validatedQuery as ProductQuery,
    })
    res.json(result)
  }

  getMyProducts = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const products = await this.productModel.getByOwner({ owner: req.user.id })
    res.json(products)
  }

  create = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const newProduct = await this.productModel.create({
      input: { ...req.body, owner: req.user.id },
    })
    res.status(201).json(newProduct)
  }

  getById = async (req: Request<{ id: string }>, res: Response) => {
    const product = await this.productModel.getById({ id: req.params.id })
    if (!product) throw new AppError('Product not found', 404)
    res.json(product)
  }

  update = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const updated = await this.productModel.update({
      id: req.params.id,
      input: req.body,
    })
    if (!updated) throw new AppError('Product not found', 404)
    res.json(updated)
  })

  delete = async (req: Request<{ id: string }>, res: Response) => {
    const deleted = await this.productModel.delete({ id: req.params.id })
    if (!deleted) throw new AppError('Product not found', 404)
    res.json({ message: 'Product deleted' })
  }
}
