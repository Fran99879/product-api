import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "./env.js";
import { logger } from "../lib/logger.js";

/**
 * Mailer SMTP (nodemailer). La config es opcional: si faltan las env vars el
 * mailer queda deshabilitado y `sendMail` es un no-op (solo loguea). Así la app
 * y los tests corren sin SMTP, y en prod basta con setear las variables.
 */

const isConfigured = Boolean(
  ENV.SMTP_HOST && ENV.SMTP_PORT && ENV.MAIL_FROM
);

let transporter: Transporter | null = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    // 465 = TLS implícito; el resto (587/2525) usa STARTTLS.
    secure: ENV.SMTP_PORT === 465,
    auth:
      ENV.SMTP_USER && ENV.SMTP_PASS
        ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS }
        : undefined,
  });
} else {
  logger.warn("[mailer] SMTP sin configurar — los emails están deshabilitados");
}

export const mailerEnabled = isConfigured;

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Envía un email. Best-effort: nunca lanza — un fallo de envío no debe romper
 * el flujo de negocio que lo dispara (ej: actualizar el estado de una orden).
 */
export async function sendMail(payload: MailPayload): Promise<void> {
  if (!transporter) {
    logger.info({ to: payload.to, subject: payload.subject }, "[mailer] deshabilitado, email omitido");
    return;
  }

  try {
    await transporter.sendMail({ from: ENV.MAIL_FROM, ...payload });
    logger.info({ to: payload.to, subject: payload.subject }, "[mailer] email enviado");
  } catch (error) {
    logger.error({ err: error, to: payload.to, subject: payload.subject }, "[mailer] fallo al enviar email");
  }
}
