import { Role } from "./role.js"

export interface JwtPayloadUser {
  id: string
  role: Role
}