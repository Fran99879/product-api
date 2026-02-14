import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import type { OrderModel } from '../models/order.model.js'
import { createOrderController } from '../controllers/order/order.controller.js'
import { validateSchema } from '../middlewares/validate.middleware.js'
import { createOrderSchema, updateOrderSchema } from '../schemas/order.schema.js'
import { orderIdSchema, orderQuerySchema } from '../schemas/order.schema.js'

export const createOrderRouter = ({ orderModel }: { orderModel: OrderModel }) => {
  const router = Router()
  const controller = createOrderController({ orderModel })

router.get(
  '/',
  authRequired,
  requireRoles('admin'),
  validateSchema(orderQuerySchema, 'query'),
  controller.getAll
)

router.get(
  '/my',
  authRequired,
  controller.getMyOrders
)

router.get(
  '/seller',
  authRequired,
  requireRoles('seller', 'admin'),
  controller.getSellerOrders
)

router.post(
  '/',
  authRequired,
  validateSchema(createOrderSchema, 'body'),
  controller.create
)

router.get(
  '/:id',
  authRequired,
  validateSchema(orderIdSchema, 'params'),
  controller.getById
)

router.patch(
  '/:id',
  authRequired,
  validateSchema(updateOrderSchema, 'body'),
  validateSchema(orderIdSchema, 'params'),
  controller.update
)

router.delete(
  '/:id',
  authRequired,
  validateSchema(orderIdSchema, 'params'),
  controller.remove
)


  return router
}

export default createOrderRouter
