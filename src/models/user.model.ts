import type { User, UserRole } from '../types/user.js'

export interface UserModel {
  findByEmail(params: { email: string }): Promise<User | null>

  findById(params: { id: string }): Promise<User | null>

  create(params: {
    input: {
      username: string
      email: string
      password: string
      role?: UserRole
    }
  }): Promise<User>

  updateRole(params: { id: string; role: UserRole }): Promise<User | null>

  getAll(): Promise<User[]>

  // Reset de contraseña (F11.7)
  setPasswordResetToken(params: {
    email: string
    tokenHash: string
    expires: Date
  }): Promise<User | null>

  findByValidResetToken(params: { tokenHash: string }): Promise<User | null>

  resetPassword(params: { id: string; passwordHash: string }): Promise<void>

  // Verificación de email (F11.7)
  setEmailVerificationToken(params: {
    id: string
    tokenHash: string
    expires: Date
  }): Promise<void>

  verifyEmailByToken(params: { tokenHash: string }): Promise<User | null>
}
