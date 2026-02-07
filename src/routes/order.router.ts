import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { OrderController } from '../controllers/order/order.controller.js'
import { MongoOrderModel } from '../models/mongo/order/order.model.js'

const router = Router()

// Instantiate the model and controller
const orderModel = MongoOrderModel
const orderController = new OrderController(orderModel)

// Get all orders (admin only)
router.get(
  '/',
  authRequired,
  requireRoles('admin'),
  (req, res) => orderController.getAll(req, res)
)

// Get current user's orders
router.get(
  '/my',
  authRequired,
  (req, res) => orderController.getMyOrders(req as any, res)
)

// Get orders for products owned by current user (seller)
router.get(
  '/seller',
  authRequired,
  requireRoles('seller'),
  (req, res) => orderController.getSellerOrders(req as any, res)
)

// Get order by ID
router.get(
  '/:id',
  authRequired,
  (req, res) => orderController.getById(req, res)
)

// Create new order
router.post(
  '/',
  authRequired,
  (req, res) => orderController.create(req as any, res)
)

// Update order
router.patch(
  '/:id',
  authRequired,
  orderController.update
)

// Delete order
router.delete(
  '/:id',
  authRequired,
  (req, res) => orderController.delete(req as any, res)
)

export default router
