import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/appError.js'
import { logger } from '../lib/logger.js'
import { captureError } from '../config/sentry.js'

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500
  let message = 'Internal Server Error'
  let errors: unknown = undefined

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err instanceof ZodError) {
    statusCode = 400
    message = 'Validation error'
    errors = err.issues
  } else if (err instanceof Error) {
    message = err.message
  }

  const isDev = process.env.NODE_ENV === 'development'

  logger.error({
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    statusCode,
    message,
    stack: err instanceof Error ? err.stack : undefined,
    errors,
  })

  // Solo errores de servidor: los 4xx son casos de negocio esperados,
  // mandarlos a Sentry sería puro ruido.
  if (statusCode >= 500) {
    captureError(err, {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      path: req.originalUrl,
    })
  }

  res.status(statusCode).json({
    message,
    requestId: req.requestId,
    ...(errors ? { errors } : {}),
    ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
  })
}
