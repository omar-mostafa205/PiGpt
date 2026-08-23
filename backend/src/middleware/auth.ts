import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { logger } from "../utils/logger.js";
import { ensureUser } from "../services/storage/ensureUser.js";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    if (!auth.isAuthenticated || !auth.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.clerkAuth = { userId: auth.userId };

    // Guarantees the row every write's foreign key points at. A failure here is
    // not an auth problem, so it must not be reported as one.
    try {
      await ensureUser(auth.userId);
    } catch (err) {
      logger.error("ensureUser failed", err);
      return res.status(503).json({
        error: "Could not prepare your account. Please try again.",
      });
    }

    return next();
  } catch (err) {
    logger.warn("Auth failed", { error: (err as Error).message });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
