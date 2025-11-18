import z from 'zod'

export const productSchema = z.object({
    nombre: z.string({
      invalid_type_error: 'Product title must be a string',
      require_error: 'Product title is required. Plase, check url'
    }),
    descripcion: z.string(),
    precio: z.number().int().positive(),
    image: z.string().url({
      message: 'Image must be a valid URL'
    }),//.endsWith('.jpg')
    marca: z.enum(['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola'], {
      require_error: 'Product is required',
      invalid_type_error: 'Product marca must be an array of enum marca'
    }),
    rate: z.number().min(0).max(10),
})

function validateProduct(object) {
  return productSchema.safeParse(object)
}

module.exports = {
  validateProduct
}