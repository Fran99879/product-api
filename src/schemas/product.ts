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

export type Product = z.infer<typeof productSchema> & {
  id: string
}
export type ProductInput = z.infer<typeof productSchema>
export type ProductUpdate = z.infer<typeof productSchema.partial>

// DTO para actualización parcial: Partial del Product pero sin permitir propiedades extra
export const productUpdateSchema = productSchema.partial().strict()
export type UpdateProductDTO = z.infer<typeof productUpdateSchema>

export const validateProduct = (input: unknown) => {
  return productSchema.safeParse(input)
}

export const validatePartialProduct = (input: unknown) => {
  return productSchema.partial().safeParse(input)
}

// Validador / parser para convertir unknown -> UpdateProductDTO
export function parseUpdateProduct(input: unknown): UpdateProductDTO {
  const result = productUpdateSchema.safeParse(input)
  if (!result.success) {
    // Lanzar con información para la capa superior (controller/service) maneje el error
    throw result.error
  }
  return result.data
}

export const validateUpdateProduct = (input: unknown) => {
  const result = productUpdateSchema.safeParse(input)

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


// Type guard si se prefiere (no lanza)
export function isUpdateProductDTO(input: unknown): input is UpdateProductDTO {
  return productUpdateSchema.safeParse(input).success
}
