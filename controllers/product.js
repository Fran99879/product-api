import { validateProduct, validatePartialProduct } from '../schemas/product.js'
import { ProductModel } from '../models/product.js'

export class ProductController {
  static async getAll (req, res) {
    const { marca } = req.query
    const products = await ProductModel.getAll({ marca })
    res.json(products)
  }
  static async create (req, res) {
    const result = validateProduct(req.body)
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const newProd = await ProductModel.create({ input: result.data })
    res.status(201).json(newProd)
  }

  static async getById (req, res) {
    const { id } = req.params
    const pro = await ProductModel.getById(id)
    if (pro) return res.json(pro)
    res.status(404).json({ message: 'No se encontro el producto' })
  }
  static async update (req, res) {
    const result = validatePartialProduct(req.body)
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const { id } = req.params
    const updateProd = await ProductModel.update({ id, input: result.data })
    return res.json(updateProd)
  }
  static async delete (req, res) {
    const { id } = req.params
    const result = await ProductModel.delete({ id })
    if (result === false) { return res.status(404).json({ message: 'Product not found' }) }
    return res.json({ message: 'Product deleted' })
  }
}