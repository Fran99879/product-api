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
}
