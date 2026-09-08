import { Pool } from "pg";
import { getDatabaseUrl } from "../config/env.js";

const DATABASE_CONNECT_TIMEOUT_MS = 3_000;

let pool: Pool | undefined;

function getPool(): Pool {
  pool ??= new Pool({
    connectionString: getDatabaseUrl(),
    connectionTimeoutMillis: DATABASE_CONNECT_TIMEOUT_MS,
    max: 1,
  });

  return pool;
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const result = await getPool().query<{ database: string }>(
      "SELECT current_database() AS database",
    );

    return result.rows[0]?.database === "amaram_inventario_db";
  } catch {
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await pool?.end();
}
