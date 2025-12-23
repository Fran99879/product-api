import { Router } from 'express'
import { authRequired } from '../../middlewares/validateToken.js'
import { validateSchema } from '../../middlewares/validate.middleware.js'
import { createOrderSchema } from '../../schemas/order.js'
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getAllOrders,
  deleteOrder,
  updateOrderStatus
} from '../../controllers/order/order.js'
import { requireRoles } from '../../middlewares/role.middleware.js'
import { updateOrderStatusSchema } from '../../schemas/order.js'

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

router.put(
  '/:id/status',
  authRequired,
  validateSchema(updateOrderStatusSchema),
  updateOrderStatus
)

router.delete('/:id', authRequired, deleteOrder)

export default router
