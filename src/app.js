import express, { json } from 'express'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import { corsMiddleware } from './middlewares/cors.js'
import { createProductRouter } from './routes/product/product.js'
import authRoutes from './routes/user/auth.js'
import orderRoutes from './routes/order/order.js'

export const createApp = ({ productModel }) => {
  const app = express()

  app.use(morgan('dev'))
  app.use(corsMiddleware())
  app.use(json())
  app.use(cookieParser(process.env.TOKEN_SECRET))

  app.disable('x-powered-by')

  app.use('/orders', orderRoutes)
  app.use('/user', authRoutes)
  app.use('/products', createProductRouter({ productModel }))

  return app
}