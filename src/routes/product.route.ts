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
} from '../schemas/product.js'

import type { ProductModel } from '../models/product.model.js'

export const createProductRouter = ({ productModel }: { productModel: ProductModel }) => {
  const productRouter = Router()
  const productController = new ProductController(productModel)

  productRouter.get('/', validateSchema(productQuerySchema, 'query'), productController.getAll)

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

  return productRouter
}
