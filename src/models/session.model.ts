export interface Session {
  id: string
  userId: string
  userAgent: string
  expiresAt: Date
  createdAt: Date
}

export interface SessionModel {
  create(params: {
    userId: string
    tokenHash: string
    userAgent: string
    expiresAt: Date
  }): Promise<Session>

  findByHash(params: { tokenHash: string }): Promise<Session | null>

  deleteByHash(params: { tokenHash: string }): Promise<void>

  /** Revoca una sesión concreta del usuario. Devuelve true si borró algo. */
  deleteById(params: { id: string; userId: string }): Promise<boolean>

  /** Revoca todas las sesiones del usuario, opcionalmente salvo una (por hash). */
  deleteAllForUser(params: { userId: string; exceptHash?: string }): Promise<void>

  listForUser(params: { userId: string }): Promise<Session[]>
}
