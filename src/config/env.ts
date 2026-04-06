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
  MONGO_URI: requireEnv('MONGO_URI'),
  TOKEN_SECRET: requireEnv('TOKEN_SECRET')
}