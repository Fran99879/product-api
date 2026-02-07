import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import type { OrderModel } from '../models/order.model.js'
import { createOrderController } from '../controllers/order/order.controller.js'

export const createOrderRouter = ({ orderModel }: { orderModel: OrderModel }) => {
  const router = Router()
  const controller = createOrderController({ orderModel })

  router.get('/', authRequired, requireRoles('admin'), controller.getAll)
  router.get('/my', authRequired, controller.getMyOrders)
  router.get('/seller', authRequired, requireRoles('seller', 'admin'), controller.getSellerOrders)
  router.post('/', authRequired, controller.create)
  router.get('/:id', controller.getById)
  router.patch('/:id', authRequired, controller.update)
  router.delete('/:id', authRequired, controller.remove)

  return router
}

export default createOrderRouter
