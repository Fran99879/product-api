import { ENV } from "../config/env.js";
import { sendMail } from "../config/mailer.js";

/** Base del frontend (primer CLIENT_URL) para armar el link de reset. */
function clientBase(): string {
  return ENV.CLIENT_URLS.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
}

/**
 * Manda el email con el link de reset de contraseña. Best-effort (delega en
 * `sendMail`, que no lanza). El `rawToken` va en la URL; en la DB guardamos solo
 * su hash.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  username: string;
  rawToken: string;
}): Promise<void> {
  const link = `${clientBase()}/reset-password?token=${params.rawToken}`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h1 style="font-size:20px;margin:0 0 8px">Restablecer contraseña</h1>
    <p style="color:#444;line-height:1.5;margin:0 0 16px">Hola ${params.username}, recibimos un pedido para restablecer tu contraseña. El enlace vence en 1 hora.</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">Cambiar mi contraseña</a></p>
    <p style="color:#888;font-size:13px;line-height:1.5">Si no lo pediste, ignorá este email; tu contraseña no cambia.</p>
    <p style="color:#aaa;font-size:12px;margin-top:24px">Marketplace</p>
  </div>`;

  const text = [
    "Restablecer contraseña",
    "",
    `Hola ${params.username}, para cambiar tu contraseña entrá al siguiente enlace (vence en 1 hora):`,
    link,
    "",
    "Si no lo pediste, ignorá este email.",
  ].join("\n");

  await sendMail({
    to: params.to,
    subject: "Restablecer tu contraseña",
    html,
    text,
  });
}
