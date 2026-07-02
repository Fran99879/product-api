import { Router } from 'express'
import { createAuthController } from '../controllers/user/auth.controller.js'
import { MongoUserModel } from '../models/mongo/user/user.model.js'
import { authRequired } from '../middlewares/validateToken.js'
import { authLimiter } from '../middlewares/rateLimit.js'

export const authRouter = Router()

const authController = createAuthController(MongoUserModel)

authRouter.post('/register', authLimiter, authController.register)
authRouter.post('/login', authLimiter, authController.login)
authRouter.post('/logout', authController.logout)

authRouter.get('/profile', authRequired, authController.profile)

export default authRouter
