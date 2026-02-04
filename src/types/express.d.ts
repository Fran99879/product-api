import type { JwtPayloadUser } from './auth.js'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayloadUser
      product?: unknown
    }
  }
}
