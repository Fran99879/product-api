import type { Request } from 'express'
import type { JwtPayloadUser } from '../types/auth.js'

export function assertUser(req: Request): asserts req is Request & { user: JwtPayloadUser } {
  if (!req.user) {
    throw new Error('User not attached to request')
  }
}
