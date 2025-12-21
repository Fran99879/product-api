import cors from 'cors'

const ACCEPTED_ORIGINS = [
  'http://localhost:8080'
]
export const corsMiddleware = ({ acceptedOrigin = ACCEPTED_ORIGINS } = {}) => cors({
  origin: (origin, callback) => {
    if (acceptedOrigin.includes(origin) || !origin) {
      return callback(null, origin)
    }
    return callback(new Error('Not allowed by CORS'))
  }
})


