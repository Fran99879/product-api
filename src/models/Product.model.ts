import type { ProductInput, ProductUpdate } from '../schemas/product.js'

export interface ProductModel {
  getAll(params: { brand?: string }): Promise<unknown[]>
  getByOwner(params: { owner: string }): Promise<unknown[]>
  getById(params: { id: string }): Promise<unknown | null>
  create(params: { input: ProductInput }): Promise<unknown>
  update(params: { id: string; input: ProductUpdate }): Promise<unknown>
  delete(params: { id: string }): Promise<boolean>
}
