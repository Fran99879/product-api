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
} from '../../schemas/auth.js'
import { sendPasswordResetEmail } from '../../emails/password-reset.email.js'
import { sendEmailVerificationEmail } from '../../emails/email-verification.email.js'
import { logger } from '../../lib/logger.js'
import type { UserModel } from '../../models/user.model.js'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

const hashToken = (raw: string) =>
  crypto.createHash('sha256').update(raw).digest('hex')

export const createAuthController = (userModel: UserModel) => {
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

      const isMatch = await bcrypt.compare(password, userFound.password)

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const token = await createAccessToken({
        id: userFound.id,
        role: userFound.role,
      })

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

  const logout = (_req: Request, res: Response) => {
    return res.json({ message: 'Session closed' })
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

  return {
    register,
    login,
    logout,
    profile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
  }
}
