import type { JwtPayloadUser } from './auth.js'
import type { Product } from '../schemas/product.js'
import type { Order } from '../schemas/order.schema.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadUser
      product?: Product
      order?: Order
    }
  }
}

export {}
