import mongoose from 'mongoose'
import { ENV } from '../env.js'

/**
 * En tests (NODE_ENV=test) la conexión va a una base SEPARADA: los beforeEach
 * de la suite hacen deleteMany() y no deben pisar los datos de desarrollo.
 * Prioridad: MONGO_URI_TEST si está seteada; si no, se deriva de MONGO_URI
 * agregando el sufijo "-test" al nombre de la base (query params intactos).
 */
export function resolveMongoUri(): string {
  if (process.env.NODE_ENV !== 'test') return ENV.MONGO_URI
  if (ENV.MONGO_URI_TEST) return ENV.MONGO_URI_TEST

  const url = new URL(ENV.MONGO_URI)
  const dbName = url.pathname.replace(/^\//, '') || 'app'
  url.pathname = `/${dbName}-test`
  return url.toString()
}

export async function connectMongo() {
  try {
    const uri = resolveMongoUri()
    // Pool de conexiones: 10 era un techo bajo para concurrencia. Default 50,
    // ajustable por env (MONGO_POOL_SIZE) según el tier de Mongo en producción.
    const maxPoolSize = Number(process.env.MONGO_POOL_SIZE) || 50
    await mongoose.connect(uri, {
      maxPoolSize,
    })

    console.log(`MongoDB connected (db: ${mongoose.connection.name})`)
  } catch (error) {
    console.error('Mongo connection error')
    console.error(error)
    process.exit(1)
  }
}
