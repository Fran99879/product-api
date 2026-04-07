import type { Product, ProductInput, ProductUpdate } from '../schemas/product.js'

export interface ProductModel {
  getAll(params: { brand?: string }): Promise<Product[]>

  getById(params: { id: string }): Promise<Product | null>

  getByOwner(params: { owner: string }): Promise<Product[]>

  create(params: { input: ProductInput }): Promise<Product>

  update(params: { id: string; input: ProductUpdate }): Promise<Product | null>

  delete(params: { id: string }): Promise<boolean>
}
