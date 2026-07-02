import type { JwtPayloadUser } from './auth.js'
import type { Product } from '../schemas/product.js'
import type { Order } from '../schemas/order.schema.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadUser
      product?: Product
      order?: Order
      requestId?: string
      // Query validada por validateSchema: en Express 5 req.query es un
      // getter que re-parsea en cada acceso, así que no se puede mutar.
      validatedQuery?: unknown
    }
  }
}

export {}
