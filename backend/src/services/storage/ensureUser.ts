import { clerkClient } from "@clerk/express";
import { prisma } from "./neonStorage.js";
import { logger } from "../../utils/logger.js";

/**
 * Every controller writes `req.clerkAuth.userId` into columns that are foreign
 * keys to `User.id`, so a User row has to exist under that exact id. This
 * creates one on first sight, using the Clerk id as the primary key so the two
 * identities can never drift apart.
 *
 * The in-process cache is only an optimisation. It cannot be trusted on its
 * own: a row deleted straight from the database leaves the cache claiming the
 * user exists, and every write then fails its foreign key. Callers that are
 * about to insert can pass `force` to re-check.
 */
const seen = new Set<string>();

/** A per-account address that can never collide with a real one. */
const placeholderEmail = (clerkId: string) => `${clerkId}@users.noreply.pigpt`;

const isUniqueViolation = (err: unknown) =>
  (err as { code?: string })?.code === "P2002" ||
  /Unique constraint failed/i.test(String((err as Error)?.message ?? ""));

export async function ensureUser(clerkId: string, force = false): Promise<void> {
  if (!force && seen.has(clerkId)) return;

  const existing = await prisma.user.findUnique({
    where: { id: clerkId },
    select: { id: true },
  });
  if (existing) {
    seen.add(clerkId);
    return;
  }

  // The row is missing, so anything cached about it was wrong.
  seen.delete(clerkId);

  let email = placeholderEmail(clerkId);
  let firstName: string | null = null;
  let lastName: string | null = null;

  try {
    const user = await clerkClient.users.getUser(clerkId);
    email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? email;
    firstName = user.firstName;
    lastName = user.lastName;
  } catch {
    // A profile lookup failure must not block the request.
  }

  try {
    await prisma.user.create({ data: { id: clerkId, clerkId, email, firstName, lastName } });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;

    // `User.email` is unique, but Clerk issues separate accounts that can share
    // an address (a Google sign-in and a password sign-in, say). The row still
    // has to exist or every write for this user fails its foreign key, so fall
    // back to an address that cannot collide.
    logger.warn(`Email already in use, using a placeholder | id=${clerkId}`);
    await prisma.user.create({
      data: { id: clerkId, clerkId, email: placeholderEmail(clerkId), firstName, lastName },
    });
  }

  seen.add(clerkId);
  logger.info(`User row created | id=${clerkId}`);
}
