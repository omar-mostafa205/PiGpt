import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** Comma-separated browser origins allowed in production. */
  CORS_ORIGINS: z.string().default(""),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(" Invalid environment variables:");
  parsed.error.issues.forEach((e) => {
    console.error(`  ${e.path.join(".")}: ${e.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
