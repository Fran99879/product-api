export class AppError extends Error {
  public readonly statusCode: number
  public readonly status: 'fail' | 'error'
  public readonly isOperational: boolean = true

  constructor(message: string, statusCode: number) {
    super(message)

    this.statusCode = statusCode
    this.status = statusCode >= 500 ? 'error' : 'fail'

    // mantiene el stack limpio (sin constructor)
    Error.captureStackTrace(this, this.constructor)
  }
}
