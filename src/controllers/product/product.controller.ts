import type { Request, Response } from 'express'
import type { ProductModel } from '../../models/product.model.js'
import { AppError } from '../../errors/appError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

export class ProductController {
  constructor(private readonly productModel: ProductModel) {}

  getAll = async (req: Request, res: Response) => {
    const { brand } = req.query
    const products = await this.productModel.getAll({
      brand: brand as string | undefined
    })
    res.json(products)
  }

  getMyProducts = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const products = await this.productModel.getByOwner({ owner: req.user.id })
    res.json(products)
  }

  create = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const newProduct = await this.productModel.create({
      input: { ...req.body, owner: req.user.id }
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
      input: req.body
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
 