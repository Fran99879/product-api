import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayloadUser } from '../types/auth.ts'
import { verifyAccessToken } from '../utils/jwt.js'

export const authRequired = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token, authorization denied',
    })
  }

  const [, token] = authHeader.split(' ')

  if (!token) {
    return res.status(401).json({
      message: 'No token, authorization denied',
    })
  }

  try {
    const decoded = verifyAccessToken(token)

    if (!decoded || typeof decoded === 'string') {
      return res.status(403).json({
        message: 'Invalid token payload',
      })
    }

    req.user = decoded as JwtPayloadUser
    next()
  } catch (err) {
    // Token vencido → 401 para que el cliente intente refrescar el access token.
    // Token adulterado/otro error → 403 (no se refresca, se fuerza re-login).
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' })
    }

    return res.status(403).json({
      message: 'Invalid token',
    })
  }
}
