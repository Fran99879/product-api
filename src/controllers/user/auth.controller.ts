import type { Request, Response } from 'express'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../../utils/jwt.js'
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateGoogleAuth,
} from '../../schemas/auth.js'
import { googleEnabled, verifyGoogleIdToken } from '../../config/google.js'
import { sendPasswordResetEmail } from '../../emails/password-reset.email.js'
import { sendEmailVerificationEmail } from '../../emails/email-verification.email.js'
import { logger } from '../../lib/logger.js'
import type { UserModel } from '../../models/user.model.js'
import type { SessionModel } from '../../models/session.model.js'
import {
  generateRefreshToken,
  hashRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE,
  REFRESH_TTL_MS,
} from '../../utils/refreshToken.js'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

const hashToken = (raw: string) =>
  crypto.createHash('sha256').update(raw).digest('hex')

export const createAuthController = (
  userModel: UserModel,
  sessionModel: SessionModel
) => {
  // Crea una sesión de refresh (guarda el hash) y setea la cookie httpOnly.
  const issueRefreshSession = async (
    res: Response,
    userId: string,
    userAgent: string
  ) => {
    const rawToken = generateRefreshToken()
    await sessionModel.create({
      userId,
      tokenHash: hashRefreshToken(rawToken),
      userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    })
    setRefreshCookie(res, rawToken)
  }
  // Genera y guarda (hasheado) un token de verificación y dispara el email.
  // Best-effort: no bloquea ni rompe el flujo que lo llama.
  const issueEmailVerification = async (user: {
    id: string
    email: string
    username: string
  }) => {
    const rawToken = crypto.randomBytes(32).toString('hex')
    await userModel.setEmailVerificationToken({
      id: user.id,
      tokenHash: hashToken(rawToken),
      expires: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
    })

    void sendEmailVerificationEmail({
      to: user.email,
      username: user.username,
      rawToken,
    }).catch((err) => logger.error({ err }, 'email verification email failed'))
  }

  const register = async (req: Request, res: Response) => {
    const result = validateRegister(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const { email, password, username } = result.data

    try {
      const passwordHash = await bcrypt.hash(password, 10)

      const userSaved = await userModel.create({
        input: {
          username,
          email,
          password: passwordHash,
          role: 'user',
        },
      })

      const token = await createAccessToken({
        id: userSaved.id,
        role: userSaved.role,
      })

      // Mail de verificación de email (best-effort, no bloquea el registro).
      await issueEmailVerification(userSaved)

      // Sesión de refresh (cookie httpOnly).
      await issueRefreshSession(res, userSaved.id, req.headers['user-agent'] ?? '')

      return res.status(201).json({
        token,
        user: {
          id: userSaved.id,
          username: userSaved.username,
          email: userSaved.email,
          role: userSaved.role,
          emailVerified: userSaved.emailVerified,
          createdAt: userSaved.createdAt,
        },
      })
    } catch (error) {
      // E11000: índice único de Mongo (email duplicado)
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        return res.status(409).json({ message: 'Email already registered' })
      }

      return res.status(500).json({
        message: "Error registering user",
      });
    }
  }

  const login = async (req: Request, res: Response) => {
    const result = validateLogin(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const { email, password } = result.data

    try {
      const userFound = await userModel.findByEmail({ email })

      // Mensaje genérico idéntico para "no existe" y "password mala":
      // evita user enumeration.
      if (!userFound) {
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      // Cuentas de Google no tienen contraseña: el login tradicional no aplica.
      if (!userFound.password) {
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const isMatch = await bcrypt.compare(password, userFound.password)

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const token = await createAccessToken({
        id: userFound.id,
        role: userFound.role,
      })

      // Sesión de refresh (cookie httpOnly).
      await issueRefreshSession(res, userFound.id, req.headers['user-agent'] ?? '')

      return res.status(200).json({
        token,
        user: {
          id: userFound.id,
          username: userFound.username,
          email: userFound.email,
          role: userFound.role,
          emailVerified: userFound.emailVerified,
        },
      })
    } catch {
      // No exponer detalles internos del error al cliente.
      return res.status(500).json({ message: 'Login error' })
    }
  }

  const logout = async (req: Request, res: Response) => {
    // Invalidar la sesión de refresh en el server, no solo en el cliente.
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (raw) {
      await sessionModel.deleteByHash({ tokenHash: hashRefreshToken(raw) })
    }
    clearRefreshCookie(res)
    return res.json({ message: 'Session closed' })
  }

  const refresh = async (req: Request, res: Response) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined

    if (!raw) {
      return res.status(401).json({ message: 'No refresh token' })
    }

    const tokenHash = hashRefreshToken(raw)
    const session = await sessionModel.findByHash({ tokenHash })

    // No existe (o ya fue rotada/revocada) o venció → 401 y limpiar cookie.
    if (!session || session.expiresAt.getTime() < Date.now()) {
      if (session) await sessionModel.deleteByHash({ tokenHash })
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const user = await userModel.findById({ id: session.userId })

    if (!user) {
      await sessionModel.deleteByHash({ tokenHash })
      clearRefreshCookie(res)
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    // Rotación: se descarta el refresh usado y se emite uno nuevo.
    await sessionModel.deleteByHash({ tokenHash })
    await issueRefreshSession(res, user.id, req.headers['user-agent'] ?? '')

    const token = await createAccessToken({ id: user.id, role: user.role })

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })
  }

  const getSessions = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })

    // Id de la sesión actual (para marcarla) sin exponer hashes hacia afuera.
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined
    const current = raw
      ? await sessionModel.findByHash({ tokenHash: hashRefreshToken(raw) })
      : null

    const sessions = await sessionModel.listForUser({ userId: req.user.id })

    return res.json(
      sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        current: current ? s.id === current.id : false,
      }))
    )
  }

  const revokeSession = async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })

    const deleted = await sessionModel.deleteById({
      id: req.params.id,
      userId: req.user.id,
    })

    if (!deleted) return res.status(404).json({ message: 'Session not found' })

    return res.json({ message: 'Session revoked' })
  }

  const revokeOtherSessions = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })

    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined
    await sessionModel.deleteAllForUser({
      userId: req.user.id,
      exceptHash: raw ? hashRefreshToken(raw) : undefined,
    })

    return res.json({ message: 'Other sessions revoked' })
  }

  const forgotPassword = async (req: Request, res: Response) => {
    const result = validateForgotPassword(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const { email } = result.data

    // Token en claro para el email + hash para la DB (nunca guardamos el crudo).
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    const user = await userModel.setPasswordResetToken({ email, tokenHash, expires })

    // Solo mandamos el mail si el email existe, pero la RESPUESTA es siempre la
    // misma (200 genérico) para no filtrar qué emails están registrados.
    if (user) {
      void sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        rawToken,
      }).catch((err) => logger.error({ err }, 'password reset email failed'))
    }

    return res.status(200).json({
      message: 'Si el email está registrado, te enviamos un enlace para restablecer la contraseña.',
    })
  }

  const resetPassword = async (req: Request, res: Response) => {
    const result = validateResetPassword(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const { token, password } = result.data

    const user = await userModel.findByValidResetToken({ tokenHash: hashToken(token) })

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await userModel.resetPassword({ id: user.id, passwordHash })

    return res.status(200).json({ message: 'Contraseña actualizada' })
  }

  const profile = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const userFound = await userModel.findById({ id: req.user.id })

    if (!userFound) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      id: userFound.id,
      username: userFound.username,
      email: userFound.email,
      role: userFound.role,
      emailVerified: userFound.emailVerified,
      createdAt: userFound.createdAt,
    })
  }

  const verifyEmail = async (req: Request, res: Response) => {
    const result = validateVerifyEmail(req.body)

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    const user = await userModel.verifyEmailByToken({
      tokenHash: hashToken(result.data.token),
    })

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' })
    }

    return res.status(200).json({ message: 'Email verificado' })
  }

  const resendVerification = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await userModel.findById({ id: req.user.id })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'El email ya está verificado' })
    }

    await issueEmailVerification(user)

    return res.status(200).json({ message: 'Te reenviamos el email de verificación.' })
  }

  // Respuesta común de auth (mismo shape que login/register para reusar el front).
  const authResponse = (
    res: Response,
    user: { id: string; username: string; email: string; role: string; emailVerified: boolean },
    token: string
  ) =>
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })

  const googleAuth = async (req: Request, res: Response) => {
    if (!googleEnabled) {
      return res.status(503).json({ message: 'Login con Google no disponible' })
    }

    const result = validateGoogleAuth(req.body)
    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues })
    }

    let payload
    try {
      payload = await verifyGoogleIdToken(result.data.idToken)
    } catch {
      return res.status(401).json({ message: 'Token de Google inválido' })
    }

    const providerId = payload.sub
    const email = payload.email
    if (!providerId || !email) {
      return res.status(401).json({ message: 'Token de Google inválido' })
    }
    // Seguridad: solo confiamos en emails verificados por Google (evita account
    // takeover al vincular una cuenta local por email).
    if (!payload.email_verified) {
      return res.status(401).json({ message: 'El email de Google no está verificado' })
    }

    try {
      // 1) Ya vinculada por providerId → login directo.
      let user = await userModel.findByProviderId({ providerId })

      // 2) Existe una cuenta con ese email → vincularla con Google.
      if (!user) {
        const existing = await userModel.findByEmail({ email })
        if (existing) {
          user = await userModel.linkGoogleAccount({ id: existing.id, providerId })
        }
      }

      // 3) No existe → registro automático (sin contraseña, email ya verificado).
      if (!user) {
        user = await userModel.create({
          input: {
            username: payload.name || email.split('@')[0] || email,
            email,
            role: 'user',
            provider: 'google',
            providerId,
            emailVerified: true,
          },
        })
      }

      if (!user) {
        return res.status(500).json({ message: 'No se pudo iniciar sesión con Google' })
      }

      const token = await createAccessToken({ id: user.id, role: user.role })
      await issueRefreshSession(res, user.id, req.headers['user-agent'] ?? '')
      return authResponse(res, user, token)
    } catch (error) {
      // Carrera: índice único (email/providerId) → reintentar login por providerId.
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        const existing = await userModel.findByProviderId({ providerId })
        if (existing) {
          const token = await createAccessToken({ id: existing.id, role: existing.role })
          await issueRefreshSession(res, existing.id, req.headers['user-agent'] ?? '')
          return authResponse(res, existing, token)
        }
      }
      logger.error({ err: error }, 'google auth failed')
      return res.status(500).json({ message: 'Error al iniciar sesión con Google' })
    }
  }

  return {
    register,
    login,
    logout,
    refresh,
    profile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    getSessions,
    revokeSession,
    revokeOtherSessions,
    googleAuth,
  }
}
