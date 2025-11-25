import express, { json } from 'express'

import productRouter from './routes/product.js'
import { corsMiddleware } from './middlewares/cors.js'

const app = express()

app.use(corsMiddleware())
app.use(json())
app.disable('x-powered-by')

app.use('/products', productRouter)

const PORT = process.env.PORT ?? 1212

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})