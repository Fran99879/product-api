import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { requireRoles } from '../middlewares/role.middleware.js'
import { paymentsController } from '../controllers/payments/payments.controller.js'

export const paymentsRouter = Router()

// --- Conexión del vendedor (token manual de Mercado Pago) ---
paymentsRouter.get(
  '/connection',
  authRequired,
  requireRoles('seller', 'admin'),
  paymentsController.getConnection
)
paymentsRouter.put(
  '/connection',
  authRequired,
  requireRoles('seller', 'admin'),
  paymentsController.connect
)
paymentsRouter.delete(
  '/connection',
  authRequired,
  requireRoles('seller', 'admin'),
  paymentsController.disconnect
)

// --- Checkout (comprador) ---
paymentsRouter.post('/orders/:id/preference', authRequired, paymentsController.createPreference)
paymentsRouter.post('/orders/:id/confirm', authRequired, paymentsController.confirmPayment)

// --- Webhook público de Mercado Pago ---
paymentsRouter.post('/webhook', paymentsController.webhook)

export default paymentsRouter
