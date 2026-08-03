import crypto from 'node:crypto'
import { ENV } from '../config/env.js'

/**
 * Cifrado simétrico para secretos guardados en la DB (ej: el Access Token de
 * Mercado Pago del vendedor). AES-256-GCM (autenticado).
 *
 * La clave se deriva del TOKEN_SECRET con separación de dominio (un prefijo
 * propio) para no reutilizar literalmente el secreto de firma de JWT como clave
 * de cifrado. No agrega una variable de entorno nueva obligatoria.
 */
const key = crypto
  .createHash('sha256')
  .update(`mp-token-enc:${ENV.TOKEN_SECRET}`)
  .digest()

const PREFIX = 'enc:v1:'

/** Cifra un texto. Formato: `enc:v1:<iv>:<tag>:<ciphertext>` (hex). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

/**
 * Descifra un valor producido por `encryptSecret`. Si el valor no tiene el
 * prefijo (dato legado guardado en texto plano), lo devuelve tal cual para
 * mantener la compatibilidad hasta que se vuelva a guardar cifrado.
 */
export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value

  const [, , ivHex, tagHex, dataHex] = value.split(':')
  if (!ivHex || !tagHex || !dataHex) return value

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  )
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}
