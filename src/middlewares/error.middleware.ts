import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/appError.js'

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // default values
  let statusCode = 500
  let message = 'Internal Server Error'
  let errors: unknown = undefined

  // errores de negocio (nuestros)
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // errores de validación Zod
  else if (err instanceof ZodError) {
    statusCode = 400
    message = 'Validation error'
    errors = err.issues
  }

  // errores desconocidos (bugs)
  else if (err instanceof Error) {
    message = err.message
  }

  const isDev = process.env.NODE_ENV === 'development'

  res.status(statusCode).json({
    message,
    ...(errors ? { errors } : {}),
  })
}
