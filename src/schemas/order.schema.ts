import { z } from 'zod'
import { orderStatusSchema } from './order.js'

export const orderItemSchema = z.object({
  product: z.string().min(1, { message: 'Product id is required' }),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' }),
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, { message: 'At least one item is required' }),
  // Dirección/ubicación de entrega (opcional), para coordinar el envío.
  shippingAddress: z.string().trim().max(200).optional(),
  // Clave de idempotencia (opcional): si se repite el mismo request (doble-click,
  // reintento, multi-pestaña) devolvemos la orden ya creada en vez de duplicarla.
  idempotencyKey: z.string().min(8).max(100).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
})

export const updateOrderAddressSchema = z.object({
  address: z.string().min(5, { message: 'Address is required' }),
})

export const cancelOrderSchema = z.object({}).optional()

export type OrderItemInput = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema> & { buyer: string }
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type UpdateOrderAddressInput = z.infer<typeof updateOrderAddressSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>

export type OrderItem = {
  product: {
    id: string
    name: string
    brand: string
    image?: string
    owner: string
  }
  quantity: number
  price: number
}

export type Order = {
  id: string
  buyer: {
    id: string
    username: string
    email: string
  }
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress?: string
  createdAt: string
  updatedAt: string
}

export const orderIdSchema = z.object({
  id: z.string().min(1, { message: 'Order id is required' }),
})

export const orderQuerySchema = z.object({
  role: z.enum(['admin', 'seller', 'user']).optional(),
  userId: z.string().optional(),
})

export const validateCreateOrder = (input: unknown) => createOrderSchema.safeParse(input)
export const validateUpdateOrderStatus = (input: unknown) =>
  updateOrderStatusSchema.safeParse(input)
