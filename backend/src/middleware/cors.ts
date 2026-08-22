import cors from "cors";
import { env } from "../config/env.js";

const allowedOrigins =
  env.NODE_ENV === "production" ? ["https://app.railway.app"] : true;

export const corsMiddleware = cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Retry-After"],
  maxAge: 86400,
});
