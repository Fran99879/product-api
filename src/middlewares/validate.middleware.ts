import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'

type RequestPart = 'body' | 'params' | 'query'

export const validateSchema =
  <T>(schema: ZodType<T>, part: RequestPart = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[part]

    const result = schema.safeParse(dataToValidate)

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    if (typeof req[part] === 'object' && req[part] !== null) {
      Object.keys(req[part]).forEach((key) => {
        delete (req[part] as Record<string, unknown>)[key]
      })

      Object.assign(req[part] as Record<string, unknown>, result.data as Record<string, unknown>)
    }

    next()
  }
