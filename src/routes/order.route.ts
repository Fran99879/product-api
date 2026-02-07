import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { validateSchema } from '../middlewares/validate.middleware.js'
import { createOrderSchema } from '../schemas/order.js'
import {
  create,
  getById,
  getSellerOrders,
  getAll,
  delete,
  update
} from '../controllers/order/order.controller.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import { updateOrderStatusSchema } from '../schemas/order.js'

const router = Router()

router.post(
  '/',
  authRequired,
  validateSchema(createOrderSchema),
  create
)

router.get(
  '/my',
  authRequired,
  getById
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
  getAll
)

router.put(
  '/:id/status',
  authRequired,
  validateSchema(updateOrderStatusSchema),
  update
)

router.delete(
  '/:id', 
  authRequired, 
  delete)

export default router


