import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { logger } from "./utils/logger.js";
import { router } from "./routes/index.js";

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────
// Must be registered before other middleware so Clerk can read cookies/headers.
app.use(clerkMiddleware());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(rateLimitMiddleware);

// ── Health check (public) ──────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`🚀 MathGPT backend running on port ${env.PORT}`);
});

export default app;
