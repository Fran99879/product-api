import type { Request, Response, NextFunction } from 'express'
import type { JwtPayloadUser } from '../types/auth.ts'
import { verifyAccessToken } from '../utils/jwt.js'

export const authRequired = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token, authorization denied'
    })
  }

  const [, token] = authHeader.split(' ')

  if (!token) {
    return res.status(401).json({
      message: 'No token, authorization denied'
    })
  }

  try {
    const decoded = verifyAccessToken(token)

    if (!decoded || typeof decoded === 'string') {
      return res.status(403).json({
        message: 'Invalid token payload'
      })
    }

    req.user = decoded as JwtPayloadUser
    next()
  } catch {
    return res.status(403).json({
      message: 'Invalid token'
    })
  }
}