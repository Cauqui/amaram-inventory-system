import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "../config/env.js";

// Conexion preparada sin abrir conexiones durante el arranque de la API.
// PrismaClient se incorporara cuando se autoricen los primeros modelos.
export function createDatabaseAdapter(): PrismaPg {
  return new PrismaPg({ connectionString: getDatabaseUrl() });
}
