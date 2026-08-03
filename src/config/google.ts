import { OAuth2Client, type TokenPayload } from 'google-auth-library'
import { ENV } from './env.js'

/**
 * Verificación del ID Token de Google (Google OAuth).
 *
 * `verifyIdToken` valida por nosotros: firma (contra las claves públicas de
 * Google), expiración (`exp`), emisor (`iss` ∈ accounts.google.com) y audiencia
 * (`aud` === nuestro GOOGLE_CLIENT_ID). Si algo no cuadra, lanza.
 *
 * Sin `GOOGLE_CLIENT_ID` configurado, el login con Google queda deshabilitado
 * (el login tradicional sigue funcionando).
 */
export const googleEnabled = Boolean(ENV.GOOGLE_CLIENT_ID)

const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID)

export async function verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: ENV.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  if (!payload) throw new Error('Empty Google token payload')
  return payload
}
