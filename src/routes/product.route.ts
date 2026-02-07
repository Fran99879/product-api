import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { ProductController } from '../controllers/product/product.controller.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import { canEditProduct } from '../middlewares/ownership.middleware.js'
import type { ProductModel } from '../models/product.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'


export const createProductRouter = (
  { productModel }: { productModel: ProductModel }
) => {

  const productRouter = Router()

  const productController = new ProductController( productModel )

  productRouter.get('/', productController.getAll)

  productRouter.get(
    '/my-products',
    authRequired,
    requireRoles('seller', 'admin'),asyncHandler
    (productController.getMyProducts)
  )

  productRouter.post(
    '/',
    authRequired,
    requireRoles('seller', 'admin'),asyncHandler
    (productController.create)
  )

  productRouter.get('/:id', productController.getById)

  productRouter.patch(
    '/:id',
    authRequired,
    requireRoles('seller', 'admin'),
    canEditProduct(productModel),
    productController.update
  )

  productRouter.delete(
    '/:id',
    authRequired,
    requireRoles('seller', 'admin'),
    canEditProduct(productModel),
    productController.delete
  )

  return productRouter
}
