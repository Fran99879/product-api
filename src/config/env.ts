import 'dotenv/config'

function requireEnv(variable: string): string {
  const value = process.env[variable]

  if (!value) {
    throw new Error(`Missing environment variable: ${variable}`)
  }

  return value
}

export const ENV = {
  PORT: Number(process.env.PORT ?? 3000),

  DB_TYPE: requireEnv('DB_TYPE') as 'mongo' | 'mysql' | 'local',

  MONGO_URI: process.env.MONGO_URI ?? '',

  TOKEN_SECRET: requireEnv('TOKEN_SECRET')
}
