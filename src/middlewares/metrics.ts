import type { Request, Response, NextFunction } from 'express'

/**
 * Request metrics en memoria (F11.5). Sin dependencias ni infra: acumula
 * contadores por ruta+método+status y latencias, y se expone como JSON en
 * GET /health/metrics. Suficiente para ver tráfico, errores y rutas lentas;
 * si algún día hay Prometheus/Grafana, se reemplaza por prom-client.
 */

interface RouteMetrics {
  count: number
  errors5xx: number
  totalMs: number
  maxMs: number
  // Reservorio acotado de latencias para percentiles (últimas N muestras)
  samples: number[]
}

const MAX_SAMPLES = 500

const routes = new Map<string, RouteMetrics>()
const startedAt = new Date()
let totalRequests = 0
let totalErrors5xx = 0

/** Ruta "normalizada": el path del router (sin ids) para no explotar cardinalidad. */
function routeKey(req: Request, res: Response): string {
  // req.route existe solo si un handler matcheó; si no (404/429), agrupamos aparte.
  const routePath = req.route?.path as string | undefined
  if (!routePath) {
    return res.statusCode === 404 ? '(not found)' : `${req.method} (sin ruta)`
  }

  // Ojo: si la respuesta salió del error handler global, Express ya restauró
  // req.baseUrl a '' al desapilar el router. Reconstruimos el mount desde
  // originalUrl (acá todos los routers están montados a primer nivel).
  const firstSegment = `/${(req.originalUrl.split('?')[0] ?? '').split('/')[1] ?? ''}`
  const base = req.baseUrl || (routePath.startsWith(firstSegment) ? '' : firstSegment)
  const suffix = routePath === '/' ? '' : routePath
  return `${req.method} ${`${base}${suffix}` || '/'}`
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    const key = routeKey(req, res)

    let m = routes.get(key)
    if (!m) {
      m = { count: 0, errors5xx: 0, totalMs: 0, maxMs: 0, samples: [] }
      routes.set(key, m)
    }

    m.count += 1
    m.totalMs += ms
    if (ms > m.maxMs) m.maxMs = ms
    if (m.samples.length >= MAX_SAMPLES) m.samples.shift()
    m.samples.push(ms)

    totalRequests += 1
    if (res.statusCode >= 500) {
      m.errors5xx += 1
      totalErrors5xx += 1
    }
  })

  next()
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)] ?? 0
}

export function getMetricsSnapshot() {
  const byRoute = [...routes.entries()]
    .map(([route, m]) => {
      const sorted = [...m.samples].sort((a, b) => a - b)
      return {
        route,
        count: m.count,
        errors5xx: m.errors5xx,
        avgMs: Math.round((m.totalMs / m.count) * 10) / 10,
        p95Ms: Math.round(percentile(sorted, 95) * 10) / 10,
        maxMs: Math.round(m.maxMs * 10) / 10,
      }
    })
    .sort((a, b) => b.count - a.count)

  return {
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    totalRequests,
    totalErrors5xx,
    routes: byRoute,
  }
}

/** Solo para tests: arranca de cero. */
export function resetMetrics(): void {
  routes.clear()
  totalRequests = 0
  totalErrors5xx = 0
}
