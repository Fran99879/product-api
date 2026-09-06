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

  // Descuento de oferta (%). 0 = sin oferta. El precio final se deriva del price.
  discountPercent: z.number().int().min(0).max(95).default(0),

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
// `owner` y `sponsoredUntil` son server-owned: nunca se aceptan del cliente en
// el update (evita mass-assignment: robar/regalar productos o auto-promocionarse
// gratis). El resto de los campos son editables por el dueño.
export const productUpdateSchema = productSchema
  .omit({ owner: true })
  .partial()
  .strict()

export type Product = z.infer<typeof productSchema> & {
  id: string
  // Publicidad: fecha ISO hasta la que la promo sigue activa (o null) + flag
  // derivado para el front (no tiene que recalcular el vencimiento).
  sponsoredUntil?: string | null
  isSponsored?: boolean
}

// -----------------------------------------------------------------------------
// Publicidad: planes de promoción de productos patrocinados.
// La fuente de verdad (días y precio) vive en el server: el cliente solo elige
// un `plan` por id y el server decide la duración. Pago simulado (MVP): la
// promo se activa al instante, sin cobro real. Listo para enchufar un cobro
// real (Mercado Pago de la plataforma) más adelante.
// -----------------------------------------------------------------------------
export const PROMOTION_PLANS = {
  basic: { id: 'basic', label: '7 días', days: 7, priceUsd: 3 },
  plus: { id: 'plus', label: '15 días', days: 15, priceUsd: 6 },
  premium: { id: 'premium', label: '30 días', days: 30, priceUsd: 10 },
} as const

export type PromotionPlanId = keyof typeof PROMOTION_PLANS

export const PROMOTION_PLAN_LIST = Object.values(PROMOTION_PLANS)

export const promoteProductSchema = z.object({
  plan: z.enum(['basic', 'plus', 'premium']),
})

export type PromoteProductInput = z.infer<typeof promoteProductSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>

// DTO para actualización parcial: Partial del Product pero sin permitir propiedades extra
export type UpdateProductDTO = z.infer<typeof productUpdateSchema>

export const PRODUCT_SORT_OPTIONS = ['recent', 'price-asc', 'price-desc', 'rate-desc'] as const

export const productQuerySchema = z.object({
  // Búsqueda de texto sobre name / brand / model / description
  search: z.string().trim().max(100).optional(),

  brand: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),

  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),

  // "true" → solo productos con stock
  inStock: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),

  // "true" → incluir inactivos (uso admin/moderación). El catálogo público
  // por defecto NO muestra productos inactivos.
  includeInactive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),

  sort: z.enum(PRODUCT_SORT_OPTIONS).default('recent'),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

export type ProductQuery = z.infer<typeof productQuerySchema>

export interface PaginatedProducts {
  data: Product[]
  total: number
  page: number
  totalPages: number
}

export const productIdSchema = z.object({
  id: z.string().min(1, 'Product id is required'),
})
