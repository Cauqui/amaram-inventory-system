import { app } from "./app.js";
import { env } from "./config/env.js";
import { disconnectSessionStore } from "./config/session.js";
import { disconnectDatabase } from "./db/health.js";
import { disconnectPrisma } from "./db/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`AMARAM API: http://localhost:${env.PORT}/api/v1/health`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(`No se pudo iniciar AMARAM API: ${error.code ?? "UNKNOWN"}`);
  process.exitCode = 1;
});

async function shutdown() {
  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();
  server.close((error) => {
    clearTimeout(timeout);
    process.exitCode = error ? 1 : 0;
  });
  await Promise.all([disconnectDatabase(), disconnectPrisma(), disconnectSessionStore()]);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
