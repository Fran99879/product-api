import mongoose from 'mongoose'
import { Product as ProductSchema } from '../../../schemas/product.mongodb.js'

import type { ProductModel } from '../../product.model.js'
import type { Product, ProductInput, ProductUpdate } from '../../../schemas/product.js'

const mapDocToProduct = (doc: any): Product => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description,
  price: doc.price,
  image: doc.image,
  brand: doc.brand,
  rate: doc.rate,
  owner: doc.owner,
  quantity: doc.quantity
})

// Filtrar campos undefined para actualizar de forma segura
const filterUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  )
}

export const MongoProductModel: ProductModel = {
  async getAll ({ brand }: { brand?: string }) {
    const query = brand
      ? { brand: { $regex: brand, $options: 'i' } }
      : {}

    const docs = await ProductSchema.find(query)
    return docs.map(mapDocToProduct)
  },

  async getByOwner ({ owner }: { owner: string }) {
    const docs = await ProductSchema.find({ owner })
    return docs.map(mapDocToProduct)
  },

  async getById ({ id }: { id: string }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    const doc = await ProductSchema.findById(id)
    return doc ? mapDocToProduct(doc) : null
  },

  async create ({ input }: { input: ProductInput }) {
    const doc = await ProductSchema.create(input)
    return mapDocToProduct(doc)
  },

  async update ({ id, input }: { id: string; input: ProductUpdate }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    const updateData = filterUndefined(input as Record<string, unknown>)
    const doc = await ProductSchema.findByIdAndUpdate(id, updateData, { new: true })
    return doc ? mapDocToProduct(doc) : null
  },

  async delete ({ id }: { id: string }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false
    const result = await ProductSchema.findByIdAndDelete(id)
    return result !== null
  }
}
