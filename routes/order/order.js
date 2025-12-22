import { Router } from 'express'
import { authRequired } from '../../middlewares/validateToken.js'
import { validateSchema } from '../../middlewares/validate.middleware.js'
import { createOrderSchema } from '../../schemas/order.schema.js'
import { createOrder, getMyOrders } from '../../controllers/order/order.js'
import { requireRoles } from '../../middlewares/role.middleware.js'

const router = Router()

router.post(
  '/',
  authRequired,
  validateSchema(createOrderSchema),
  createOrder
)

router.get(
  '/my',
  authRequired,
  getMyOrders
)

router.get(
  '/seller',
  authRequired,
  requireRoles('seller'),
  getSellerOrders
)

router.get(
  '/',
  authRequired,
  requireRoles('admin'),
  getAllOrders
)

export default router
