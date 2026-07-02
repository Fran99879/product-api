import type { Request, Response, NextFunction } from 'express'

/**
 * Sanitización NoSQL injection compatible con Express 5.
 *
 * `express-mongo-sanitize` reasigna `req.query`, que en Express 5 es un
 * getter read-only y explota. Este middleware hace lo mismo (eliminar
 * claves que empiezan con `$` o contienen `.`) pero mutando los objetos
 * in-place, sin reasignar las propiedades del request.
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isForbiddenKey = (key: string): boolean =>
  key.startsWith('$') || key.includes('.')

export const sanitizeInPlace = (value: unknown): void => {
  if (Array.isArray(value)) {
    for (const item of value) sanitizeInPlace(item)
    return
  }

  if (!isPlainObject(value)) return

  for (const key of Object.keys(value)) {
    if (isForbiddenKey(key)) {
      delete value[key]
    } else {
      sanitizeInPlace(value[key])
    }
  }
}

export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  sanitizeInPlace(req.body)
  sanitizeInPlace(req.params)
  // req.query no se sanitiza acá: en Express 5 es un getter que re-parsea en
  // cada acceso (mutarlo no persiste). Con el query parser "simple" las claves
  // llegan planas (sin objetos anidados) y los endpoints validan con zod.
  next()
}
