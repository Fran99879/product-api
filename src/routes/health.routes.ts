import { Router } from 'express'
import { healthCheck } from '../controllers/health.controller.js'
import { getMetricsSnapshot } from '../middlewares/metrics.js'
import { authRequired } from '../middlewares/validateToken.js'
import { requireRoles } from '../middlewares/role.middleware.js'

const router = Router()

router.get('/', healthCheck)

// Request metrics (F11.5) — solo admin: expone rutas y volúmenes de tráfico.
router.get('/metrics', authRequired, requireRoles('admin'), (_req, res) => {
  res.json(getMetricsSnapshot())
})

export default router
