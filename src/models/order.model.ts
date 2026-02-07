import type { Order, CreateOrderInput, UpdateOrderInput } from '../schemas/order.schema.js'

export interface OrderModel {
  create(input: CreateOrderInput): Promise<Order>

  getById(id: string): Promise<Order | null>

  getAll(params?: { role?: 'admin' | 'seller' | 'user'; userId?: string }): Promise<Order[]>

  update(id: string, input: UpdateOrderInput): Promise<Order | null>

  delete(id: string): Promise<boolean>

  getByUser(userId: string): Promise<Order[]>

  getSellerOrders(sellerId: string): Promise<Order[]>
}
