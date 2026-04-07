import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, { message: 'Product title is required' }),

  description: z.string(),

  price: z.number().int().positive({ message: 'Price must be a positive integer' }),

  image: z.string().url({ message: 'Image must be a valid URL' }),

  brand: z.enum(['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola'], {
    message: 'Invalid product brand',
  }),

  rate: z.number().min(0).max(10).default(0),

  owner: z.string().optional(),

  quantity: z.number().int().min(0),
})
export const productUpdateSchema = productSchema.partial().strict()

export type Product = z.infer<typeof productSchema> & {
  id: string
}
export type ProductInput = z.infer<typeof productSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>

// DTO para actualización parcial: Partial del Product pero sin permitir propiedades extra
export type UpdateProductDTO = z.infer<typeof productUpdateSchema>

export const productQuerySchema = z.object({
  brand: z.enum(['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola']).optional(),
})

export const productIdSchema = z.object({
  id: z.string().min(1, 'Product id is required'),
})
