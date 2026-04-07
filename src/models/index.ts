import { connectMongo } from '../config/db/mongodb.js'

import { MongoProductModel } from './mongo/product/product.js'
import { MongoOrderModel } from './mongo/order/order.mongo.js'

import type { ProductModel } from './product.model.js'
import type { OrderModel } from './order.model.js'

export interface Models {
  productModel: ProductModel
  orderModel: OrderModel
}

let initialized = false

export const createModels = async (): Promise<Models> => {
  if (!initialized) {
    await connectMongo()
    initialized = true
  }

  return {
    productModel: MongoProductModel,
    orderModel: MongoOrderModel,
  }
}
