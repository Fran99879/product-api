export interface ProductModel {
  getById: (params: { id: string }) => Promise<Product | null>
}

export interface Product {
  id: string
  owner: string
}
