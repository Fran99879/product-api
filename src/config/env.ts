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