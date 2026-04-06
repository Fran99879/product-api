import { z } from 'zod'
import { ORDER_STATUS } from '../types/order.js'

export const orderStatusSchema = z.enum(ORDER_STATUS)

export const orderItemSchema = z.object({
  product: z.string().min(1, { message: 'Product ID is required' }),
  quantity: z
    .number()
    .int()
    .positive({ message: 'Quantity must be a positive integer' }),
  price: z
    .number()
    .positive({ message: 'Price must be positive' })
})

export const orderSchema = z.object({
  buyer: z.string().min(1, { message: 'Buyer ID is required' }),
  items: z
    .array(orderItemSchema)
    .min(1, { message: 'At least one item is required' }),
  total: z
    .number()
    .positive({ message: 'Total must be positive' }),
  status: z
    .enum(['pending', 'paid', 'shipped', 'cancelled'])
    .default('pending')
})

export type Order = z.infer<typeof orderSchema> & {
  id: string
}

export type OrderInput = z.infer<typeof orderSchema>

export type OrderUpdate = Partial<
  Omit<z.infer<typeof orderSchema>, 'buyer' | 'items'>
> & {
  items?: z.infer<typeof orderItemSchema>[]
}

export const orderUpdateSchema = z.object({
  status: z
    .enum(['pending', 'paid', 'shipped', 'cancelled'])
    .optional(),
  items: z.array(orderItemSchema).optional()
})

export type UpdateOrderDTO = z.infer<typeof orderUpdateSchema>

export const validateOrder = (input: unknown) => {
  return orderSchema.safeParse(input)
}

export const validatePartialOrder = (input: unknown) => {
  return orderUpdateSchema.safeParse(input)
}

export function parseUpdateOrder(input: unknown): UpdateOrderDTO {
  const result = orderUpdateSchema.safeParse(input)
  if (!result.success) {
    throw result.error
  }
  return result.data
}

export const validateUpdateOrder = (input: unknown) => {
  const result = orderUpdateSchema.safeParse(input)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues
    }
  }

  return {
    success: true,
    data: result.data
  }
}


export function isUpdateOrderDTO(input: unknown): input is UpdateOrderDTO {
  return orderUpdateSchema.safeParse(input).success
}