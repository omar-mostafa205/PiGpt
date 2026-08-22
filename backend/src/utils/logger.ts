import { env } from "../config/env.js";

type Level = "info" | "warn" | "error" | "debug";

function formatMessage(level: Level, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const metaStr = meta
    ? ` ${JSON.stringify(meta, null, env.NODE_ENV === "development" ? 2 : 0)}`
    : "";
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: unknown) {
    console.log(formatMessage("info", message, meta));
  },
  warn(message: string, meta?: unknown) {
    console.warn(formatMessage("warn", message, meta));
  },
  error(message: string, meta?: unknown) {
    console.error(formatMessage("error", message, meta));
  },
  debug(message: string, meta?: unknown) {
    if (env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};
