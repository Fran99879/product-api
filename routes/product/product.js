import { Router } from 'express'
import { authRequired } from '../../middlewares/validateToken.js'
import { ProductController } from '../../controllers/product/product.js'
import { requireRoles } from '../../middlewares/role.middleware.js'
import { canEditProduct } from '../../middlewares/ownership.middleware.js'

export const createProductRouter = ({ productModel }) => {
  const productRouter = Router()

  const productController = new ProductController({ productModel })

  productRouter.get('/', productController.getAll)

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
    productController.create
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
