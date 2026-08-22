import type { Context } from "hono";
import { ZodSchema, ZodError } from "zod";

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; error: Record<string, string[]> };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns a discriminated union so controllers can branch cleanly.
 */
export async function validateBody<T>(
  c: Context,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let raw: unknown;

  try {
    raw = await c.req.json();
  } catch {
    return {
      success: false,
      error: { _: ["Invalid JSON — request body could not be parsed"] },
    };
  }

  const result = schema.safeParse(raw);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors = (result.error as ZodError).flatten().fieldErrors as Record<
    string,
    string[]
  >;

  return { success: false, error: fieldErrors };
}

/** Sanitise a free-text string — strip control chars, trim whitespace */
export function sanitiseText(input: string): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, "") // strip control characters
    .trim();
}

/** Return true if the value looks like a base64-encoded JPEG or PNG */
export function isValidImageBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]+=*$/.test(value) && value.length > 100;
}
