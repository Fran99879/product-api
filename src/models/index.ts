import { connectMongo } from '../config/db/mongodb.js'

import { MongoProductModel } from './mongo/product/product.js'
import { LocalProductModel } from './local-file-system/product.js'
import { MongoOrderModel } from './mongo/order/order.mongo.js'

import type { ProductModel } from './product.model.js'
import type { OrderModel } from './order.model.js'

export interface Models {
  productModel: ProductModel
  orderModel: OrderModel
}

export const createModels = async (): Promise<Models> => {
  const { DB_TYPE } = process.env

  if (!DB_TYPE) throw new Error('DB_TYPE no definido en .env')

  if (DB_TYPE === 'mongo') {
    await connectMongo()

    return {
      productModel: MongoProductModel,
      orderModel: MongoOrderModel
    }
  }

  if (DB_TYPE === 'local') {
    return {
      productModel: LocalProductModel,
      orderModel: MongoOrderModel
    }
  }

  throw new Error('❌ DB_TYPE inválido')
}
