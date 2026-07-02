import jwt from 'jsonwebtoken'
import { ENV } from '../config/env.js'
import type { JwtPayloadUser } from '../types/auth.js'

export function createAccessToken(payload: JwtPayloadUser): Promise<string> {

  return new Promise((resolve, reject) => {
    jwt.sign(
      payload satisfies JwtPayloadUser,
      ENV.TOKEN_SECRET,
      // Access token de vida corta: el refresh token (cookie httpOnly) lo renueva.
      { expiresIn: '15m' },
      (err, token) => {
        if (err || !token) return reject(err)
        resolve(token)
      }
    )
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ENV.TOKEN_SECRET)
}
