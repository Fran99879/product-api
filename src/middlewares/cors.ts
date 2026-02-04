import cors from 'cors'
import type { CorsOptions } from 'cors'

const ACCEPTED_ORIGINS = [
  'http://localhost:8080'
]

interface CorsMiddlewareOptions {
  acceptedOrigin?: string[]
}

export const corsMiddleware = (
  { acceptedOrigin = ACCEPTED_ORIGINS }: CorsMiddlewareOptions = {}
) => {
  const options: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true)
      }
      if (acceptedOrigin.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    }
  }

  return cors(options)
}
