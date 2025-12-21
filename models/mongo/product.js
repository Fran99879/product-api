import mongoose from 'mongoose'
import { Product } from '../../schemas/product.mongodb.js'

export class ProductModel {
  static async getAll ({ marca }) {
    if (marca) {
      return Product.find({
        marca: { $regex: marca, $options: 'i' }
      })
    }
    return Product.find()
  }

  static async getById ({ id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    return await Product.findById(id)
  }

  static async create ({ input }) {
    const product = new Product(input)
    return product.save()
  }

  static async delete ({ id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false

    const result = await Product.findByIdAndDelete(id)
    return result !== null
  }

  static async update ({ id, input }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    return Product.findByIdAndUpdate(
      id,
      input,
      { new: true }
    )
  }
}
