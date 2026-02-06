export type UserRole = 'user' | 'seller' | 'admin'

export interface User {
  id: string
  username: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
