import type { Request, Response, NextFunction } from "express";
import { prisma } from "../services/storage/neonStorage.js";
import { logger } from "../utils/logger.js";

/** GET /api/notes — saved lecture summaries, newest first. */
export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.clerkAuth!.userId;

  try {
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json({ notes });
  } catch (err) {
    logger.error("getNotes error", err);
    next(err);
  }
};

/** DELETE /api/notes/:id */
export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.clerkAuth!.userId;
  const id = String(req.params.id ?? "");

  try {
    // Scoped by userId so one account cannot delete another's note.
    const { count } = await prisma.note.deleteMany({ where: { id, userId } });
    if (count === 0) return res.status(404).json({ error: "Note not found" });
    return res.json({ ok: true });
  } catch (err) {
    logger.error("deleteNote error", err);
    next(err);
  }
};
