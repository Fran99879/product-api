import type { Order } from '../schemas/order.schema.js'
import { ENV } from '../config/env.js'
import { sendMail } from '../config/mailer.js'

function formatMoney(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

/** Link al panel de pedidos recibidos del vendedor (usa el primer CLIENT_URL). */
function sellerOrdersUrl(): string | null {
  const base = ENV.CLIENT_URLS.split(',')[0]?.trim()
  return base ? `${base.replace(/\/$/, '')}/seller/orders` : null
}

/**
 * Notifica al vendedor que una de sus órdenes fue pagada (nueva venta).
 * Best-effort: delega en `sendMail`, que no lanza. No hace nada si no hay email.
 */
export async function sendSellerSaleEmail(order: Order, sellerEmail?: string): Promise<boolean> {
  if (!sellerEmail) return false

  const shortId = order.id.slice(-8)
  const link = sellerOrdersUrl()
  const cta = link
    ? `<p style="margin:24px 0"><a href="${link}" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">Ver el pedido</a></p>`
    : ''

  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0;color:#444">${i.quantity}× ${
          i.product.name ?? 'Producto'
        }</td><td style="padding:4px 0;text-align:right;color:#444">${formatMoney(
          i.price * i.quantity
        )}</td></tr>`
    )
    .join('')

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#111">
    <h1 style="font-size:20px;margin:0 0 8px">¡Tenés una nueva venta! 🎉</h1>
    <p style="color:#444;line-height:1.5;margin:0 0 16px">El pago del pedido <strong>#${shortId}</strong> fue aprobado. Ya podés prepararlo para el envío.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
      <tr><td style="padding:8px 0 0;color:#888;border-top:1px solid #eee">Total cobrado</td><td style="padding:8px 0 0;text-align:right;font-weight:600;color:#111;border-top:1px solid #eee">${formatMoney(
        order.total
      )}</td></tr>
    </table>
    ${cta}
    <p style="color:#aaa;font-size:12px;margin-top:24px">Marketplace</p>
  </div>`

  const text = [
    '¡Tenés una nueva venta!',
    '',
    `El pago del pedido #${shortId} fue aprobado.`,
    `Total cobrado: ${formatMoney(order.total)}`,
    link ? `\nVer el pedido: ${link}` : '',
  ].join('\n')

  await sendMail({
    to: sellerEmail,
    subject: `Nueva venta pagada — pedido #${shortId} 🎉`,
    html,
    text,
  })
  return true
}
