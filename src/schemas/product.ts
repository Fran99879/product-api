import { z } from 'zod'

export const productSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Product title is required' }),

  description: z.string(),

  price: z
    .number()
    .int()
    .positive({ message: 'Price must be a positive integer' }),

  image: z
    .string()
    .url({ message: 'Image must be a valid URL' }),

  brand: z.enum(['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola'], {
    message: 'Invalid product brand'
  }),

  rate: z
    .number()
    .min(0)
    .max(10)
    .default(0),

  owner: z.string().optional(),

  quantity: z
    .number()
    .int()
    .min(0)
})

export type ProductInput = z.infer<typeof productSchema>
export type ProductUpdate = z.infer<typeof productSchema.partial>

export const validateProduct = (input: unknown) => {
  return productSchema.safeParse(input)
}

export const validatePartialProduct = (input: unknown) => {
  return productSchema.partial().safeParse(input)
}
