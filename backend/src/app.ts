import express from "express";
import cors from "cors";
import { isDatabaseConnected } from "./db/health.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: "http://localhost:8443" }));
app.use(express.json({ limit: "100kb" }));

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
