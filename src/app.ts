import express, { json, type Application } from 'express'
import morgan from 'morgan'

import { corsMiddleware } from './middlewares/cors.js'
import { createProductRouter } from './routes/product.route.js'
import authRoutes from './routes/auth.route.js'
import { createOrderRouter } from './routes/order.route.js'
import adminRouter from './routes/admin.route.js'
import healthRoutes from './routes/health.routes.js'
import type { ProductModel } from './models/product.model.js'
import type { OrderModel } from './models/order.model.js'
import { notFound } from './middlewares/notFound.middleware.js'
import { globalErrorHandler } from './middlewares/error.middleware.js'
import { requestId } from './middlewares/requestId.js'
import { errorHandler } from './middlewares/errorHandler.js'

interface CreateAppDependencies {
  productModel: ProductModel
  orderModel: OrderModel
}

export const createApp = ({ productModel, orderModel }: CreateAppDependencies): Application => {
  const app = express()

  app.use(morgan('dev'))
  app.use(corsMiddleware())
  app.use(json())

  app.use(requestId)

  app.disable('x-powered-by')

  app.use('/health', healthRoutes)
  app.use('/orders', createOrderRouter({ orderModel }))
  app.use('/user', authRoutes)
  app.use('/admin', adminRouter)
  app.use('/products', createProductRouter({ productModel }))

  app.use(notFound)

  app.use(globalErrorHandler)

  return app
}
