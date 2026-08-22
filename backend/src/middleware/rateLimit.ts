import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory store — replace with Redis for multi-instance deployments
const store = new Map<string, RateLimitEntry>();

const { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } = env;

// Prune expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    logger.warn(`Rate limit hit | ip=${ip}`);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Too many requests — please slow down" });
  }

  entry.count++;
  return next();
};
