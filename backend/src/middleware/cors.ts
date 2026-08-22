import cors from "cors";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Allowed origins come from CORS_ORIGINS (comma separated) so the deployed
 * domain is configuration rather than a value baked into the source.
 *
 * A native app sends no Origin header, so requests from the iOS/Android build
 * are always allowed; the list only constrains browsers.
 */
const configured = env.CORS_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isProduction = env.NODE_ENV === "production";

if (isProduction && configured.length === 0) {
  logger.warn(
    "CORS_ORIGINS is empty — browser requests will be rejected in production. " +
      "Set it to your web origin(s), e.g. https://app.example.com"
  );
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin: a native app, curl, or a same-origin server call.
    if (!origin) return callback(null, true);
    if (!isProduction) return callback(null, true);
    if (configured.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Retry-After"],
  maxAge: 86400,
});
