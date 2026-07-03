import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  MONGO_URI: z
    .string()
    .url("MONGO_URI must be a valid URL"),

  // DB para los tests (opcional): si falta, se deriva de MONGO_URI con el
  // sufijo "-test". Los tests NUNCA deben correr contra la DB de desarrollo.
  MONGO_URI_TEST: z.string().optional(),

  TOKEN_SECRET: z
    .string()
    .min(10, "TOKEN_SECRET must be at least 10 characters"),

  CLIENT_URLS: z
    .string()
    .min(1, "CLIENT_URLS is required"),

  // URL pública del backend, usada como notification_url de Mercado Pago.
  // Opcional: en local el webhook no es alcanzable y el pago se confirma al
  // volver (sync). En producción, seteala a la URL pública de la API.
  API_PUBLIC_URL: z.string().url().optional(),

  // Cloudinary (F11.3) — subida de imágenes de productos
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME is required"),

  CLOUDINARY_API_KEY: z
    .string()
    .min(1, "CLOUDINARY_API_KEY is required"),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET is required"),

  // Carpeta destino en Cloudinary (tiene default, no hace falta setearla)
  CLOUDINARY_FOLDER: z.string().default("marketplace/products"),

  // Email SMTP (F11.4) — mails de estado de orden. TODO opcional: si falta la
  // config, el mailer queda deshabilitado (no rompe la app ni los tests).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Remitente de los mails, ej: "Marketplace <no-reply@marketplace.com>"
  MAIL_FROM: z.string().optional(),

  // Sentry (F11.5) — error monitoring. Opcional: sin DSN queda deshabilitado
  // (no rompe la app ni los tests), igual que el mailer.
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables",
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const ENV = parsed.data;