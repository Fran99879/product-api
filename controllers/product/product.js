import { validateProduct, validatePartialProduct } from '../../schemas/product.js'

export class ProductController {
  constructor({ productModel }) {
    this.productModel = productModel
  }
  getAll = async (req, res) => {
    const { brand } = req.query
    const products = await this.productModel.getAll({ brand })
    res.json(products)
  }
  getMyProducts = async (req, res) => {
    const products = await this.productModel.getByOwner({
      owner: req.user.id
    })
    res.json(products)
  }
  create = async (req, res) => {
    const result = validateProduct(req.body)
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newProd = await this.productModel.create({
      input: {
        ...result.data,
        owner: req.user.id
      }
    })

    res.status(201).json(newProd)
  }
  getById = async (req, res) => {
    const { id } = req.params
    const pro = await this.productModel.getById({ id })
    if (pro) return res.json(pro)
    res.status(404).json({ message: 'No se encontro el producto' })
  }
  update = async (req, res) => {
    const result = validatePartialProduct(req.body)
    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const { id } = req.params
    const updateProd = await this.productModel.update({ id, input: result.data })
    return res.json(updateProd)
  }
  delete = async (req, res) => {
    const { id } = req.params
    const result = await this.productModel.delete({ id })
    if (result === false) { return res.status(404).json({ message: 'Product not found' }) }
    return res.json({ message: 'Producto Eliminado' })
  }
}

