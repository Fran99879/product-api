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
    await mongoose.connect(uri, {
      maxPoolSize: 10,
    })

    console.log(`MongoDB connected (db: ${mongoose.connection.name})`)
  } catch (error) {
    console.error('Mongo connection error')
    console.error(error)
    process.exit(1)
  }
}
