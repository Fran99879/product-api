import products from '../../products.json' with { type: 'json' }

import type { ProductModel } from '../product.model.js'
import type { Product, ProductInput, ProductUpdate } from '../../schemas/product.js'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DATA_PATH = join(__dirname, '../../products.json')

let data: Product[] = products as Product[]

export const LocalProductModel: ProductModel = {
  async getAll ({ brand }) {
    if (brand) {
      return data.filter(p =>
        p.brand.toLowerCase() === brand.toLowerCase()
      )
    }
    return data
  },

  async getByOwner ({ owner }) {
    return data.filter(p => p.owner === owner)
  },

  async getById ({ id }) {
    return data.find(p => p.id === id) ?? null
  },

  async create ({ input }: { input: ProductInput }) {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      ...input
    }

    data.push(newProduct)
    return newProduct
  },

  async update ({ id, input }: { id: string; input: Partial<ProductInput> }): Promise<Product | null> {

  const index = data.findIndex(p => p.id === id)
  if (index === -1) return null

  const existing = data[index]

if (!existing) return null

    const updated: Product = {
      id: existing.id,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      price: input.price ?? existing.price,
      image: input.image ?? existing.image,
      brand: input.brand ?? existing.brand,
      rate: input.rate ?? existing.rate,
      quantity: input.quantity ?? existing.quantity,
      owner: input.owner ?? existing.owner
    }

  data[index] = updated
await writeFile(DATA_PATH, JSON.stringify(data, null, 2))
return updated

},

  async delete ({ id }) {
    const index = data.findIndex(p => p.id === id)
    if (index === -1) return false

    data.splice(index, 1)
    await writeFile(DATA_PATH, JSON.stringify(data, null, 2))
    return true
  }
}
