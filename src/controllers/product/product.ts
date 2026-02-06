import type { Request, Response } from 'express'
import { validateProduct, validatePartialProduct } from '../../schemas/product.js'
import type { ProductModel } from '../../models/ProductModel.js'
import type { AuthenticatedRequest } from '../../types/request.js'

export class ProductController {
  constructor (private readonly productModel: ProductModel) {}

  getAll = async (req: Request, res: Response) => {
    const { brand } = req.query
    const products = await this.productModel.getAll({
      brand: typeof brand === 'string' ? brand : undefined
    })
    res.json(products)
  }

  getMyProducts = async (req: AuthenticatedRequest, res: Response) => {
  const products = await this.productModel.getByOwner({
    owner: req.user.id
  })
  res.json(products)
  }

  create = async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    res.json(product)
  }

  update = async (req: Request, res: Response) => {
    const result = validatePartialProduct(req.body)

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues
      })
    }

    const { id } = req.params
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const updated = await this.productModel.update({
      id,
      input: result.data
    })

    res.json(updated)
  }

  delete = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const deleted = await this.productModel.delete({ id })

    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json({ message: 'Producto eliminado' })
  }
}
