import { Router } from 'express'
import { createAuthController } from '../controllers/user/auth.controller.js'
import { MongoUserModel } from '../models/mongo/user/user.model.js'
import { authRequired } from '../middlewares/validateToken.js'

export const authRouter = Router()

const authController = createAuthController(MongoUserModel)

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.post('/logout', authController.logout)

authRouter.get('/profile', authRequired, authController.profile)

export default authRouter