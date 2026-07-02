import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),

  MONGO_URI: z
    .string()
    .url("MONGO_URI must be a valid URL"),

  TOKEN_SECRET: z
    .string()
    .min(10, "TOKEN_SECRET must be at least 10 characters"),

  CLIENT_URLS: z
    .string()
    .min(1, "CLIENT_URLS is required"),

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