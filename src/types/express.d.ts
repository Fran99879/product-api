import type { JwtPayloadUser } from './auth.js'
import type { Product } from '../schemas/product.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadUser
      product?: Product
    }
  }
}
export {}