import { Router } from 'express'
import { ProductController } from '../controllers/product.js'

const productRouter = Router()

productRouter.get('/', ProductController.getAll)
productRouter.post('/', ProductController.create)
productRouter.get('/:id', ProductController.getById)
productRouter.patch('/:id', ProductController.update)
productRouter.delete('/:id', ProductController.delete)

export default productRouter