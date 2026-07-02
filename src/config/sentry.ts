import * as Sentry from "@sentry/node";
import { ENV } from "./env.js";
import { logger } from "../lib/logger.js";

/**
 * Sentry (error monitoring). La config es opcional: sin SENTRY_DSN queda
 * deshabilitado y `captureError` es un no-op — la app y los tests corren
 * igual, y en prod basta con setear la variable (mismo patrón que el mailer).
 *
 * Solo captura errores (uncaught + los que reporta el error handler global).
 * Tracing/performance queda fuera a propósito: el ítem de request metrics de
 * F11.5 se resuelve aparte.
 */

export const sentryEnabled = Boolean(ENV.SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: ENV.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
  });
  logger.info("[sentry] error monitoring habilitado");
} else {
  logger.warn("[sentry] SENTRY_DSN sin configurar — error monitoring deshabilitado");
}

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
}

/** Reporta una excepción a Sentry con contexto del request. Nunca lanza. */
export function captureError(err: unknown, context: ErrorContext = {}): void {
  if (!sentryEnabled) return;

  Sentry.withScope((scope) => {
    if (context.requestId) scope.setTag("requestId", context.requestId);
    if (context.userId) scope.setUser({ id: context.userId });
    if (context.method && context.path) {
      scope.setContext("request", { method: context.method, path: context.path });
    }
    Sentry.captureException(err);
  });
}
