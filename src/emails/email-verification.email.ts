import { ENV } from "../config/env.js";
import { sendMail } from "../config/mailer.js";

/** Base del frontend (primer CLIENT_URL) para armar el link de verificación. */
function clientBase(): string {
  return ENV.CLIENT_URLS.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
}

/**
 * Manda el email para verificar la dirección. Best-effort (delega en `sendMail`,
 * que no lanza). El `rawToken` va en la URL; en la DB guardamos solo su hash.
 */
export async function sendEmailVerificationEmail(params: {
  to: string;
  username: string;
  rawToken: string;
}): Promise<void> {
  const link = `${clientBase()}/verify-email?token=${params.rawToken}`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h1 style="font-size:20px;margin:0 0 8px">Verificá tu email</h1>
    <p style="color:#444;line-height:1.5;margin:0 0 16px">Hola ${params.username}, ¡bienvenido! Confirmá tu dirección de email para activar todas las funciones de tu cuenta. El enlace vence en 24 horas.</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">Verificar mi email</a></p>
    <p style="color:#888;font-size:13px;line-height:1.5">Si no creaste esta cuenta, ignorá este email.</p>
    <p style="color:#aaa;font-size:12px;margin-top:24px">Marketplace</p>
  </div>`;

  const text = [
    "Verificá tu email",
    "",
    `Hola ${params.username}, confirmá tu dirección entrando al siguiente enlace (vence en 24 horas):`,
    link,
    "",
    "Si no creaste esta cuenta, ignorá este email.",
  ].join("\n");

  await sendMail({
    to: params.to,
    subject: "Verificá tu email",
    html,
    text,
  });
}
