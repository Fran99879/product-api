import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { ProductController } from '../controllers/product/product.controller.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import { canEditProduct } from '../middlewares/ownership.middleware.js'
import { validateSchema } from '../middlewares/validate.middleware.js'

import {
  productSchema,
  productUpdateSchema,
  productQuerySchema,
  productIdSchema,
  promoteProductSchema,
  PROMOTION_PLAN_LIST,
} from '../schemas/product.js'

import type { ProductModel } from '../models/product.model.js'

export const createProductRouter = ({ productModel }: { productModel: ProductModel }) => {
  const productRouter = Router()
  const productController = new ProductController(productModel)

  productRouter.get('/', validateSchema(productQuerySchema, 'query'), productController.getAll)

  // Sección "Destacados" del home (patrocinados activos). Pública.
  // Va antes de '/:id' para que no la capture como si "featured" fuera un id.
  productRouter.get('/featured', productController.getFeatured)

  // Planes de promoción disponibles (fuente de verdad del server, para la UI).
  productRouter.get('/promotion-plans', (_req, res) => {
    res.json(PROMOTION_PLAN_LIST)
  })

  productRouter.get(
    '/my-products',
    authRequired,
    requireRoles('seller', 'admin'),
    productController.getMyProducts
  )

  productRouter.post(
    '/',
    authRequired,
    requireRoles('seller', 'admin'),
    validateSchema(productSchema, 'body'),
    productController.create
  )

  productRouter.get(
    '/:id', 
    validateSchema(productIdSchema, 'params'), 
    productController.getById
  )

  productRouter.patch(
    '/:id',
    authRequired,
    requireRoles('seller', 'admin'),
    validateSchema(productIdSchema, 'params'),
    validateSchema(productUpdateSchema, 'body'),
    canEditProduct(productModel),
    productController.update
  )

  productRouter.delete(
    '/:id',
    authRequired,
    requireRoles('seller', 'admin'),
    validateSchema(productIdSchema, 'params'),
    canEditProduct(productModel),
    productController.delete
  )

  // Promocionar (publicidad). Solo el dueño (o admin) puede promocionar su
  // producto; el plan lo valida y traduce a días el server.
  productRouter.post(
    '/:id/promote',
    authRequired,
    requireRoles('seller', 'admin'),
    validateSchema(productIdSchema, 'params'),
    validateSchema(promoteProductSchema, 'body'),
    canEditProduct(productModel),
    productController.promote
  )

  return productRouter
}
