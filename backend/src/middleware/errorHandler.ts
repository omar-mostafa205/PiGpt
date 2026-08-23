import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

/** Gemini quota/rate-limit failures, so the app can say something useful. */
const isQuotaError = (err: any) =>
  err?.status === 429 ||
  /RESOURCE_EXHAUSTED|exceeded your current quota|rate.?limit/i.test(String(err?.message ?? ""));

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // A streaming route has already flushed its headers. Writing JSON on top of
  // that throws ERR_HTTP_HEADERS_SENT and corrupts the response the client is
  // mid-way through parsing, which surfaces as "cannot parse response".
  if (res.headersSent) {
    logger.error("Error after headers sent", err);
    return next(err);
  }

  // Multer file errors (wrong type, size exceeded)
  if (isQuotaError(err)) {
    return res.status(429).json({
      error:
        "The AI service is rate limited right now. Wait a moment and try again — " +
        "the Gemini free tier allows only a small number of requests per day.",
    });
  }

  if (err.message === "Only PDF files are supported") {
    return res.status(415).json({ error: err.message });
  }
  if ((err as NodeJS.ErrnoException).code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File exceeds 10 MB limit" });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.flatten().fieldErrors,
    });
  }

  // Gemini upstream errors
  if (err.message?.toLowerCase().includes("gemini") || err.message?.includes("status 4")) {
    logger.error("Gemini API error", err);
    return res.status(503).json({ error: "AI service temporarily unavailable" });
  }

  // Generic server error
  logger.error("Unhandled error", err);
  return res.status(500).json({
    error: "Internal server error",
    ...(env.NODE_ENV === "development" && { detail: err.message }),
  });
};
