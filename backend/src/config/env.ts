import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGIN: z.url().transform((value) => new URL(value).origin).optional(),
});
const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error("Configuracion de entorno invalida. Revisa PORT, NODE_ENV y CORS_ORIGIN.");
}
if (result.data.NODE_ENV === "production" && !result.data.CORS_ORIGIN) {
  throw new Error("Configura CORS_ORIGIN antes de iniciar el backend en produccion.");
}
export const env = {
  ...result.data,
  CORS_ORIGIN: result.data.CORS_ORIGIN ?? "http://localhost:8443",
};

export function getSessionSecret(): string {
  const result = z.string().trim().min(32).safeParse(process.env.SESSION_SECRET);

  if (!result.success) {
    throw new Error("Configura SESSION_SECRET con al menos 32 caracteres antes de usar sesiones.");
  }

  return result.data;
}

export function getDatabaseUrl(): string {
  const result = z.string().trim().min(1).safeParse(process.env.DATABASE_URL);
  if (!result.success) {
    throw new Error("Configura DATABASE_URL en backend/.env antes de usar PostgreSQL.");
  }
  const url = z.url().safeParse(result.data);
  if (!url.success || !/^postgres(ql)?:\/\//.test(result.data)) {
    throw new Error("DATABASE_URL debe ser una URL de PostgreSQL valida.");
  }
  return result.data;
}
