import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { VerifyErrors, JwtPayload } from 'jsonwebtoken'
import { ENV } from '../config/env.js'
import type { JwtPayloadUser } from '../types/auth.ts'

export const authRequired = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({
      message: 'No token, authorization denied'
    })
  }

  jwt.verify(
    token,
    ENV.TOKEN_SECRET,
    (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
      if (err) {
        return res.status(403).json({
          message: 'Invalid token'
        })
      }

      if (!decoded || typeof decoded === 'string') {
        return res.status(403).json({
          message: 'Invalid token payload'
        })
      }

      req.user = decoded as JwtPayloadUser
      next()
    }
  )
}
