import { clerkClient } from "@clerk/express";
import { prisma } from "./neonStorage.js";
import { logger } from "../../utils/logger.js";

/**
 * Every controller writes `req.clerkAuth.userId` into columns that are foreign
 * keys to `User.id`, so a User row has to exist under that exact id. This
 * upserts one on first sight, using the Clerk id as the primary key so the two
 * identities can never drift apart.
 *
 * Cached per process — the row only needs creating once per user.
 */
const seen = new Set<string>();

export async function ensureUser(clerkId: string): Promise<void> {
  if (seen.has(clerkId)) return;

  try {
    const existing = await prisma.user.findUnique({ where: { id: clerkId }, select: { id: true } });
    if (existing) {
      seen.add(clerkId);
      return;
    }

    // Only reached once per user, so the Clerk round-trip is not on the hot path.
    let email = `${clerkId}@users.noreply.pigpt`;
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

    await prisma.user.upsert({
      where: { id: clerkId },
      update: {},
      create: { id: clerkId, clerkId, email, firstName, lastName },
    });

    seen.add(clerkId);
    logger.info(`User row created | id=${clerkId}`);
  } catch (err) {
    // Never block a request on this; the write it guards will surface any error.
    logger.warn("ensureUser failed", { error: (err as Error).message });
  }
}
