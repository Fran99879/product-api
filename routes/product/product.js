import { Router } from 'express'
import { authRequired } from '../../middlewares/validateToken.js'
import { ProductController } from '../../controllers/product/product.js'
import { validateSchema } from '../../middlewares/validate.middleware.js'

export const createProductRouter = ({ productModel }) => {
  const productRouter = Router()

  const productController = new ProductController({ productModel })

  productRouter.get('/', productController.getAll)
  productRouter.post('/', authRequired, productController.create)

  productRouter.get('/:id', productController.getById)
  productRouter.patch('/:id', authRequired, productController.update)
  productRouter.delete('/:id', authRequired, productController.delete)

  return productRouter
}
