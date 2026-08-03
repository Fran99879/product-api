export type UserRole = 'user' | 'seller' | 'admin'

export type AuthProvider = 'local' | 'google'

export interface User {
  id: string
  username: string
  email: string
  password: string
  role: UserRole
  emailVerified: boolean
  // Origen de la cuenta. Las cuentas 'google' no tienen contraseña.
  provider?: AuthProvider
  providerId?: string
  createdAt: Date
  updatedAt: Date
}
