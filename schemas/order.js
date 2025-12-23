import { z } from 'zod'

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      product: z.string(),
      quantity: z.number().min(1)
    })
  ).min(1)
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled'])
})

