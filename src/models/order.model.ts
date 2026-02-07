import type { Order, OrderInput, OrderUpdate } from '../schemas/order.js'

export interface OrderModel {
  getAll(params?: { role?: 'admin' | 'seller' | 'user'; userId?: string }): Promise<Order[]>

  getById(params: { id: string }): Promise<Order | null>

  getByUser(params: { userId: string }): Promise<Order[]>

  getSellerOrders(params: { sellerId: string }): Promise<Order[]>

  create(params: { input: OrderInput }): Promise<Order>

  update(params: {
    id: string
    input: OrderUpdate
  }): Promise<Order | null>

  delete(params: { id: string }): Promise<boolean>
}
