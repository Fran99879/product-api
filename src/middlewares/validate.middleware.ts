import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'

export const validateSchema =
  <T>(schema: ZodType<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return res.status(400).json({
        errors: result.error.issues.map(issue => ({
          field: issue.path[0],
          message: issue.message
        }))
      })
    }

    req.body = result.data
    next()
  }
