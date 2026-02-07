import type { Request, Response } from 'express'
import { validateProduct, parseUpdateProduct } from '../../schemas/product.js'
import type { ZodError } from 'zod'
import type { ProductModel } from '../../models/product.model.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { AppError } from '../../errors/appError.js'


export class ProductController {
  constructor (private readonly productModel: ProductModel) {}

  getAll = async (req: Request, res: Response) => {
    const { brand } = req.query
    const products = await this.productModel.getAll({
      brand: typeof brand === 'string' ? brand : undefined
    })
    res.json(products)
  }

  getMyProducts = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const products = await this.productModel.getByOwner({
      owner: req.user.id
    })
    res.json(products)
  }

  create = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Unauthorized', 401)
    const result = validateProduct(req.body)

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues
      })
    }

    const newProduct = await this.productModel.create({
      input: {
        ...result.data,
        owner: req.user.id
      }
    })

    res.status(201).json(newProduct)
  }

  getById = async (req: Request, res: Response) => {
    const { id } = req.params

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid id' })
    }

    const product = await this.productModel.getById({ id })

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    res.json(product)
  }

  update = asyncHandler(async (req: Request<{ id: string }, any, unknown>, res: Response) => {
    const { id } = req.params

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid id' })
    }

    let dto
    try {
      dto = parseUpdateProduct(req.body)
    } catch (err) {
      const zErr = err as ZodError
      if (zErr && Array.isArray((zErr as any).issues)) {
        return res.status(400).json({ errors: (zErr as any).issues })
      }
      return res.status(400).json({ message: err instanceof Error ? err.message : String(err) })
    }

    const updated = await this.productModel.update({
      id,
      input: dto
    })

    if (!updated) {
      throw new AppError('Product not found', 404)

    }

    res.json(updated)
  })


  delete = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const deleted = await this.productModel.delete({ id })

    if (!deleted) {
      throw new AppError('Product not found', 404)

    }

    res.json({ message: 'Product deleted' })
  }
}
