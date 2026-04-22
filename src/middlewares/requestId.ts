import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] || randomUUID()

  req.requestId = String(id)
  res.setHeader('x-request-id', String(id))

  next()
}
