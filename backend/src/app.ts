import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { sessionMiddleware } from "./config/session.js";
import { isDatabaseConnected } from "./db/health.js";
import { authRouter } from "./modules/auth.js";

export const app = express();

app.disable("x-powered-by");
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(cors({ origin: "http://localhost:8443", credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(sessionMiddleware);

app.get("/api/v1/health", async (_req, res) => {
  const databaseConnected = await isDatabaseConnected();

  if (!databaseConnected) {
    return res.status(503).json({
      status: "degraded",
      service: "AMARAM API",
      database: "unavailable",
    });
  }

  return res.status(200).json({
    status: "ok",
    service: "AMARAM API",
    database: "connected",
  });
});

app.use("/api/v1/auth", authRouter);

app.use(
  (
    _error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    response.status(500).json({ error: "Internal server error." });
  },
);
