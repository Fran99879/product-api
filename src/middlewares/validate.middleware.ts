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
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      })
    }

    req[part] = result.data as any

    next()
  }
