import { z } from 'zod'

// Categorías válidas de productos electrónicos
export const VALID_CATEGORIES = [
  'smartphone',
  'tablet',
  'laptop',
  'desktop',
  'monitor',
  'tv',
  'smartwatch',
  'headphones',
  'speaker',
  'gaming',
  'storage',
  'networking',
  'camera',
  'accessories',
  'other',
] as const

export const productSchema = z.object({
  name: z.string().min(1, { message: 'Product title is required' }),

  description: z.string(),

  price: z.number().int().positive({ message: 'Price must be a positive integer' }),

  image: z.string().url({ message: 'Image must be a valid URL' }),

  brand: z.string().min(1, { message: 'Brand is required' }).trim(),

  category: z.enum(VALID_CATEGORIES, {
    message: 'Invalid product category. Must be one of: ' + VALID_CATEGORIES.join(', '),
  }),

  model: z.string().min(1, { message: 'Model is required' }),

  rate: z.number().min(0).max(10).default(0),

  quantity: z.number().int().min(0),

  isActive: z.boolean().default(true),

  specs: z.record(z.string(), z.string()).default({}),

  owner: z.string().optional(),
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
  brand: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
})

export const productIdSchema = z.object({
  id: z.string().min(1, 'Product id is required'),
})
