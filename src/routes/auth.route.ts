import { Router } from 'express'
import { createAuthController } from '../controllers/user/auth.controller.js'
import { MongoUserModel } from '../models/mongo/user/user.model.js'
import { MongoSessionModel } from '../models/mongo/session/session.model.js'
import { authRequired } from '../middlewares/validateToken.js'
import { authLimiter } from '../middlewares/rateLimit.js'

export const authRouter = Router()

const authController = createAuthController(MongoUserModel, MongoSessionModel)

authRouter.post('/register', authLimiter, authController.register)
authRouter.post('/login', authLimiter, authController.login)
authRouter.post('/logout', authController.logout)
authRouter.post('/refresh', authLimiter, authController.refresh)

authRouter.post('/forgot-password', authLimiter, authController.forgotPassword)
authRouter.post('/reset-password', authLimiter, authController.resetPassword)

authRouter.post('/verify-email', authLimiter, authController.verifyEmail)
authRouter.post(
  '/resend-verification',
  authLimiter,
  authRequired,
  authController.resendVerification
)

authRouter.get('/profile', authRequired, authController.profile)

// Gestión de sesiones (revoke) — F11.7
authRouter.get('/sessions', authRequired, authController.getSessions)
authRouter.delete('/sessions', authRequired, authController.revokeOtherSessions)
authRouter.delete('/sessions/:id', authRequired, authController.revokeSession)

export default authRouter
