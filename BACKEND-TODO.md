# 🟦 Backend TODO — F11 + F12

> Tareas que viven en el **repo del backend** (Express + MongoDB), separadas del frontend.
> Extraído del roadmap el **2026-06-20**. Trackear acá o copiar al repo del backend.

**Leyenda:** `[x]` hecho · `[~]` parcial · `[ ]` pendiente

---

## 🔒 F11.1 — Seguridad base (obligatoria, hacer PRIMERO)
- [ ] `helmet`
- [ ] `express-rate-limit`
- [ ] CORS producción exacto (origin whitelist, **no** `*`)
- [ ] Sanitización básica (input / NoSQL injection — ej. `express-mongo-sanitize`)
- [ ] Env validation fuerte (zod / envalid al arrancar, fallar si falta una var)
- [ ] Mejorar errores de auth (mensajes consistentes, no filtrar si el user existe)

---

## 🛍️ F11.2 — Catálogo serio
- [ ] Búsqueda por texto
- [ ] Filtros (categoría, marca, rango de precio, stock)
- [ ] Paginación (limit/offset o cursor)
- [ ] Sorting (precio, fecha, rate)
- [ ] Índices MongoDB (text index + índices de los campos filtrables)

> Definir el contrato de la query (`GET /products?search=&category=&minPrice=&page=&sort=`) para que el frontend lo consuma.

---

## ☁️ F11.3 — Imágenes reales
- [ ] Integrar Cloudinary o S3
- [ ] Endpoint de upload / firma de subida (signed upload)
- [ ] Delete / reemplazo en el storage
- [ ] Optimización de imágenes (transformaciones / resize)

> Cambia el contrato: `image` deja de ser una URL pegada a mano y pasa a venir del flujo de upload.

---

## 📦 F11.4 — Operación de ecommerce
- [ ] Emails de order status: `paid`, `shipped`, `delivered`, `cancelled`
- [ ] Emails register/login (opcional)
- [ ] Webhooks básicos
- [ ] Logs centralizados
- [ ] Backups DB

---

## 📊 F11.5 — Observabilidad & Analytics
- [ ] Request metrics (middleware de métricas)
- [ ] Error monitoring (Sentry)
- [ ] Logs estructurados (pino / winston)

---

## 🔐 F11.7 — Auth avanzada (opcional)
- [ ] Refresh tokens
- [ ] Rotation de refresh tokens
- [ ] Revoke sessions
- [ ] Device tracking (opcional)
- [ ] Email verification
- [ ] Forgot password (reset por token)

---

## 💳 F12 — Payments Infrastructure
- [ ] Mercado Pago Checkout Pro
- [ ] Webhooks seguros (validación de firma)
- [ ] Payment entity/model
- [ ] Idempotencia (idempotency key)
- [ ] Payment logs
- [ ] Retry handling
- [ ] Estados de pago
- [ ] Emails automáticos (confirmación / fallo)
- [ ] Refunds básicos
- [ ] Stripe integration
- [ ] Provider abstraction (interfaz común MP / Stripe)
- [ ] Crypto provider (opcional)
- [ ] Sandbox testing
- [ ] Ngrok / webhook dev local

---

## 🧠 Orden recomendado (backend)
1. **F11.1** Seguridad — antes que nada
2. **F11.2** Catálogo (búsqueda/filtros/paginación + índices)
3. **F11.3** Imágenes (storage + upload)
4. **F11.4** Operación (emails, webhooks, logs, backups)
5. **F11.5** Analytics / observabilidad
6. **F11.7** Auth avanzada
7. **F12** Payments (cuando el core esté firme)

> El SEO (F11.6) es 100% frontend → no aparece acá. Ver `ROADMAP-F11-F12.md`.
