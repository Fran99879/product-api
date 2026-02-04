import z from 'zod'

export const productSchema = z.object({
  name: z.string({
    invalid_type_error: 'Product title must be a string',
    required_error: 'Product title is required. Plase, check url'
  }),
  description: z.string(),
  price: z.number().int().positive(),
  image: z.string().url({
    message: 'Image must be a valid URL'
  }),//.endsWith('.jpg')
  brand: z.enum(['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola'], {
    required_error: 'Product is required',
    invalid_type_error: 'Product brand must be an array of enum brand'
  }),
  rate: z.number().min(0).max(10).default(0),
  owner: z.string().optional(),
  quantity: z.number().int().min(0)
})

export function validateProduct (inupt) {
  return productSchema.safeParse(inupt)
}

export function validatePartialProduct (inupt) {
  return productSchema.partial().safeParse(inupt)
}