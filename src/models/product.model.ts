import type {
  PaginatedProducts,
  Product,
  ProductInput,
  ProductQuery,
  ProductUpdate,
} from '../schemas/product.js'

export interface ProductModel {
  getAll(params: { query: ProductQuery }): Promise<PaginatedProducts>

  getById(params: { id: string }): Promise<Product | null>

  getByOwner(params: { owner: string }): Promise<Product[]>

  create(params: { input: ProductInput }): Promise<Product>

  update(params: { id: string; input: ProductUpdate }): Promise<Product | null>

  delete(params: { id: string }): Promise<boolean>

  /** Activa/extiende la promoción de un producto por `days` días. */
  promote(params: { id: string; days: number }): Promise<Product | null>

  /** Productos patrocinados activos, para la sección "Destacados" del home. */
  getFeatured(params: { limit: number }): Promise<Product[]>
}
