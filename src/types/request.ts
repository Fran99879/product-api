import type { Request } from 'express'
import type { JwtPayloadUser } from './auth.js'

export interface AuthenticatedRequest extends Request {
  user: JwtPayloadUser
}