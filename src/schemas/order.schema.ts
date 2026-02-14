import { z } from 'zod'

export const orderItemSchema = z.object({
  product: z.string().min(1, { message: 'Product id is required' }),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' })
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, { message: 'At least one item is required' })
})

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']).optional(),
  items: z.array(orderItemSchema).optional()
})

export type OrderItemInput = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema> & { buyer: string }
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>

export type OrderItem = {
  product: {
    id: string
    owner: string
  }
  quantity: number
  price: number
}

export type Order = {
  id: string
  buyer: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export const orderIdSchema = z.object({
  id: z.string().min(1, { message: 'Order id is required' })
})

export const orderQuerySchema = z.object({
  role: z.enum(['admin', 'seller', 'user']).optional(),
  userId: z.string().optional()
})

export const validateCreateOrder = (input: unknown) => createOrderSchema.safeParse(input)
export const validateUpdateOrder = (input: unknown) => updateOrderSchema.safeParse(input)
