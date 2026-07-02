import type { Order } from "../schemas/order.schema.js";
import type { OrderStatus } from "../types/order.js";
import { ENV } from "../config/env.js";
import { sendMail } from "../config/mailer.js";

// Estados que notifican al comprador. `pending` no manda mail (es el estado
// inicial al crear la orden, el comprador ya está en la app).
const NOTIFIABLE = ["paid", "shipped", "delivered", "cancelled"] as const;
type NotifiableStatus = (typeof NOTIFIABLE)[number];

function isNotifiable(status: OrderStatus): status is NotifiableStatus {
  return (NOTIFIABLE as readonly string[]).includes(status);
}

const COPY: Record<NotifiableStatus, { subject: string; heading: string; body: string }> = {
  paid: {
    subject: "Pago confirmado ✅",
    heading: "¡Recibimos tu pago!",
    body: "Estamos preparando tu pedido. Te avisamos cuando salga en camino.",
  },
  shipped: {
    subject: "Tu pedido está en camino 🚚",
    heading: "¡Tu pedido salió!",
    body: "Ya está en camino a tu dirección. Pronto lo tendrás en tus manos.",
  },
  delivered: {
    subject: "Tu pedido fue entregado 📦",
    heading: "¡Entregado!",
    body: "Tu pedido llegó a destino. ¡Gracias por comprar con nosotros!",
  },
  cancelled: {
    subject: "Tu pedido fue cancelado",
    heading: "Pedido cancelado",
    body: "Tu pedido fue cancelado. Si esto no fue vos o tenés dudas, contactanos.",
  },
};

function formatMoney(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

/** Link a la sección de órdenes del comprador (usa el primer CLIENT_URL). */
function ordersUrl(): string | null {
  const base = ENV.CLIENT_URLS.split(",")[0]?.trim();
  return base ? `${base.replace(/\/$/, "")}/orders` : null;
}

function renderHtml(order: Order, copy: (typeof COPY)[NotifiableStatus]): string {
  const shortId = order.id.slice(-8);
  const link = ordersUrl();
  const cta = link
    ? `<p style="margin:24px 0"><a href="${link}" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">Ver mis pedidos</a></p>`
    : "";

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h1 style="font-size:20px;margin:0 0 8px">${copy.heading}</h1>
    <p style="color:#444;line-height:1.5;margin:0 0 16px">Hola ${order.buyer.username}, ${copy.body}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444">
      <tr><td style="padding:4px 0;color:#888">Pedido</td><td style="padding:4px 0;text-align:right">#${shortId}</td></tr>
      <tr><td style="padding:4px 0;color:#888">Artículos</td><td style="padding:4px 0;text-align:right">${order.items.length}</td></tr>
      <tr><td style="padding:4px 0;color:#888">Total</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#111">${formatMoney(order.total)}</td></tr>
    </table>
    ${cta}
    <p style="color:#aaa;font-size:12px;margin-top:24px">Marketplace</p>
  </div>`;
}

function renderText(order: Order, copy: (typeof COPY)[NotifiableStatus]): string {
  const shortId = order.id.slice(-8);
  const link = ordersUrl();
  return [
    `${copy.heading}`,
    ``,
    `Hola ${order.buyer.username}, ${copy.body}`,
    ``,
    `Pedido: #${shortId}`,
    `Artículos: ${order.items.length}`,
    `Total: ${formatMoney(order.total)}`,
    link ? `\nVer mis pedidos: ${link}` : "",
  ].join("\n");
}

/**
 * Manda el email correspondiente al estado actual de la orden, si ese estado
 * notifica. Best-effort (delega en `sendMail`, que no lanza). Devuelve `true`
 * si se disparó un envío, `false` si el estado no notifica.
 */
export async function sendOrderStatusEmail(order: Order): Promise<boolean> {
  if (!isNotifiable(order.status)) return false;

  const copy = COPY[order.status];
  await sendMail({
    to: order.buyer.email,
    subject: copy.subject,
    html: renderHtml(order, copy),
    text: renderText(order, copy),
  });
  return true;
}
