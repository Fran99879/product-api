import 'dotenv/config'
import { createApp } from './index.js'

import { connectMongo } from './database/mongodb.js'
import { ProductModel as MongoProduct } from './models/mongo/product/product.js'
// import { ProductModel as MySQLProduct } from './models/mysql/product/product.js'
import { ProductModel as LocalProduct } from './models/local-file-system/product.js'

const { PORT, DB_TYPE } = process.env

if (!PORT) throw new Error('no definido P')
if (!DB_TYPE) throw new Error('no definido')

let productModel

if (DB_TYPE === 'mongo') {
  await connectMongo()
  productModel = MongoProduct
  // } else if (DB_TYPE === 'mysql') {
  // productModel = MySQLProduct
} else if (DB_TYPE === 'local') {
  productModel = LocalProduct
} else {
  throw new Error('❌ DB_TYPE inválido')
}

const app = createApp({ productModel })

app.listen(PORT, () => {
  console.log(`Server (${DB_TYPE}) running on http://localhost:${PORT}`)
})
