import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

/** Cliente de Mercado Pago para un vendedor puntual (token manual por seller). */
export const mpClient = (accessToken: string) => new MercadoPagoConfig({ accessToken })

export const mpPreference = (accessToken: string) => new Preference(mpClient(accessToken))

export const mpPayment = (accessToken: string) => new Payment(mpClient(accessToken))

/**
 * Valida un Access Token contra la API de Mercado Pago (GET /users/me).
 * Devuelve true si el token es válido y activo.
 */
export const validateMpToken = async (accessToken: string): Promise<boolean> => {
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.ok
  } catch {
    return false
  }
}
