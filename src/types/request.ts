import type { Request } from 'express'
import type { JwtPayloadUser } from './auth.js'

export interface AuthenticatedRequest<
  Params = {},
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user: JwtPayloadUser
}
