import type { JwtPayloadUser } from './auth.js'
import type { Product } from './product.ts'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadUser
      product?: Product
    }
  }
}
export {}