import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { Pool } from "pg";
import { env, getDatabaseUrl, getSessionSecret } from "./env.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const PgSessionStore = connectPgSimple(session);

const sessionPool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 5,
});

export const sessionMiddleware = session({
  name: "amaram.sid",
  secret: getSessionSecret(),
  store: new PgSessionStore({
    pool: sessionPool,
    tableName: "user_sessions",
    createTableIfMissing: false,
    pruneSessionInterval: 15 * 60,
  }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
  },
});

export async function disconnectSessionStore(): Promise<void> {
  await sessionPool.end();
}
