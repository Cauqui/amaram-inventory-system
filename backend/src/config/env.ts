import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});
const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error("PORT debe ser un entero entre 1 y 65535.");
}
export const env = result.data;

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
