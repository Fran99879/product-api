import express, { json } from 'express'
import 'dotenv/config'
import { connectMongo } from './database/mongodb.js'

import { createProductRouter } from './routes/product.js'
import { corsMiddleware } from './middlewares/cors.js'

export const createApp = async ({ productModel }) => {
  const app = express()
  app.use(corsMiddleware())
  app.use(json())
  app.disable('x-powered-by')

  app.use('/products', createProductRouter({ productModel }))

  await connectMongo()

  app.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
  })

}
