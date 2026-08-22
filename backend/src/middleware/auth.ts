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
    // Guarantees the row every write's foreign key points at.
    await ensureUser(auth.userId);
    return next();
  } catch (err) {
    logger.warn("Auth failed", { error: (err as Error).message });
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
