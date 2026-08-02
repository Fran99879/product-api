import mongoose from 'mongoose'
import { Product as ProductSchema } from '../../../schemas/product.mongodb.js'

import type { ProductModel } from '../../product.model.js'
import type {
  Product,
  ProductInput,
  ProductQuery,
  ProductUpdate,
} from '../../../schemas/product.js'

const mapDocToProduct = (doc: any): Product => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description,
  price: doc.price,
  discountPercent: doc.discountPercent ?? 0,
  image: doc.image,
  brand: doc.brand,
  category: doc.category,
  model: doc.model,
  rate: doc.rate,
  owner: String(doc.owner),
  quantity: doc.quantity,
  isActive: doc.isActive,
  // `find()` devuelve specs como Map; `aggregate()` como objeto plano.
  specs: doc.specs instanceof Map ? Object.fromEntries(doc.specs) : (doc.specs ?? {}),
})


// Filtrar campos undefined para actualizar de forma segura
const filterUndefined = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
}

// Escapar caracteres especiales de regex en el término de búsqueda
const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const SORT_MAP: Record<ProductQuery['sort'], Record<string, 1 | -1>> = {
  recent: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  'rate-desc': { rate: -1 },
}

const buildFilter = (query: ProductQuery): Record<string, unknown> => {
  const filter: Record<string, unknown> = {}

  if (query.search) {
    const regex = { $regex: escapeRegex(query.search), $options: 'i' }
    filter.$or = [{ name: regex }, { brand: regex }, { model: regex }, { description: regex }]
  }

  if (query.brand) filter.brand = { $regex: escapeRegex(query.brand), $options: 'i' }
  if (query.category) filter.category = query.category

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    }
  }

  if (query.inStock) filter.quantity = { $gt: 0 }

  // Catálogo público: no mostrar productos inactivos. El admin puede pedir
  // verlos con includeInactive=true (para moderación).
  if (!query.includeInactive) filter.isActive = true

  return filter
}

export const MongoProductModel: ProductModel = {
  async getAll({ query }: { query: ProductQuery }) {
    const filter = buildFilter(query)
    const skip = (query.page - 1) * query.limit

    // Los productos sin stock se muestran al final de la lista, sin importar el
    // orden elegido: se ordena primero por "sin stock" y después por el sort.
    const sortStage = { _outOfStock: 1, ...SORT_MAP[query.sort] } as Record<string, 1 | -1>

    const [docs, total] = await Promise.all([
      ProductSchema.aggregate([
        { $match: filter },
        { $addFields: { _outOfStock: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] } } },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: query.limit },
      ]),
      ProductSchema.countDocuments(filter),
    ])

    return {
      data: docs.map(mapDocToProduct),
      total,
      page: query.page,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    }
  },

  async getByOwner({ owner }: { owner: string }) {
    const docs = await ProductSchema.find({ owner })
    return docs.map(mapDocToProduct)
  },

  async getById({ id }: { id: string }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    const doc = await ProductSchema.findById(id)
    return doc ? mapDocToProduct(doc) : null
  },

  async create({ input }: { input: ProductInput }) {
    const doc = await ProductSchema.create(input)
    return mapDocToProduct(doc)
  },

  async update({ id, input }: { id: string; input: ProductUpdate }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null

    const updateData = filterUndefined(input as Record<string, unknown>)
    const doc = await ProductSchema.findByIdAndUpdate(id, updateData, { new: true })
    return doc ? mapDocToProduct(doc) : null
  },

  async delete({ id }: { id: string }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false
    const result = await ProductSchema.findByIdAndDelete(id)
    return result !== null
  },
}
