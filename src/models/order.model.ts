import type {
  Order,
  CreateOrderInput
} from '../schemas/order.schema.js'

export type OrderUpdateInput = {
  status?: 'pending' | 'paid' | 'shipped' | 'cancelled'
  address?: string
}

export interface OrderModel {
  create(input: CreateOrderInput): Promise<Order>

  getById(id: string): Promise<Order | null>

  getAll(params?: {
    role?: 'admin' | 'seller' | 'user'
    userId?: string
  }): Promise<Order[]>

  update(id: string, input: OrderUpdateInput): Promise<Order | null>

  cancel(id: string): Promise<Order | null>

  delete(id: string): Promise<boolean>

  getByUser(userId: string): Promise<Order[]>

  getSellerOrders(sellerId: string): Promise<Order[]>
}