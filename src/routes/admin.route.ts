import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import { createUserController } from '../controllers/user/user.controller.js'
import { MongoUserModel } from '../models/mongo/user/user.model.js'

const adminRouter = Router()
const adminController = createUserController(MongoUserModel)

adminRouter.get(
  '/users',
  authRequired,
  requireRoles('admin'),
  adminController.listUsers
)

adminRouter.patch(
  '/users/:id/role',
  authRequired,
  requireRoles('admin'),
  adminController.updateUserRole
)

export default adminRouter
