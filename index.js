import express, { json } from 'express'
import 'dotenv/config'
import { connectMongo } from './database/mongodb.js'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import { createProductRouter } from './routes/product/product.js'
import { corsMiddleware } from './middlewares/cors.js'
import authRoutes from './routes/user/auth.js'
import orderRoutes from './routes/order/order.js'


export const createApp = async ({ productModel }) => {

  const app = express()

  app.use(morgan('dev'))
  app.use(corsMiddleware())
  app.use(json())
  app.use(cookieParser(process.env.TOKEN_SECRET))

  app.disable('x-powered-by')


  app.use('/orders', orderRoutes)
  app.use('/user', authRoutes)
  app.use('/products', createProductRouter({ productModel }))

  await connectMongo()

  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
  })

}
