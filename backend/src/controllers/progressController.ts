import type { Request, Response, NextFunction } from "express";
import { prisma } from "../services/storage/neonStorage.js";
import { logger } from "../utils/logger.js";
import { subDays, startOfDay, format } from "date-fns";

type ProgressRow = {
  subject: string;
  accuracy: number;
  totalSolved: number;
  streak: number;
};

export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.clerkAuth!.userId;

  try {
    const [progress, weeklyCount] = await Promise.all([
      prisma.progress.findMany({ where: { userId } }) as Promise<ProgressRow[]>,
      prisma.problem.count({
        where: { userId, createdAt: { gte: subDays(new Date(), 7) } },
      }),
    ]);

    const subjectBreakdown = progress.map((p) => ({
      subject: p.subject,
      accuracy: p.accuracy,
      totalSolved: p.totalSolved,
      streak: p.streak,
    }));

    const overallAccuracy =
      progress.length > 0
        ? Math.round(
            progress.reduce<number>((acc, p) => acc + p.accuracy, 0) /
              progress.length
          )
        : 0;

    const maxStreak = progress.reduce<number>(
      (max, p) => (p.streak > max ? p.streak : max),
      0
    );

    return res.json({
      weeklyProblems: weeklyCount,
      accuracy: overallAccuracy,
      streak: maxStreak,
      subjectBreakdown,
    });
  } catch (err) {
    logger.error("getProgress error", err);
    next(err);
  }
};

export const getRecentProblems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.clerkAuth!.userId;
  const page = Number(req.query.page ?? 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          subject: true,
          question: true,
          topic: true,
          correct: true,
          createdAt: true,
        },
      }),
      prisma.problem.count({ where: { userId } }),
    ]);

    return res.json({
      problems,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error("getRecentProblems error", err);
    next(err);
  }
};

/** One saved problem with its full answer, for reopening a past chat. */
export const getProblem = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.clerkAuth!.userId;
  const id = String(req.params.id ?? "");

  if (!id) return res.status(400).json({ error: "Missing problem id" });

  try {
    const problem = await prisma.problem.findFirst({
      where: { id, userId },
      select: {
        id: true,
        subject: true,
        question: true,
        answer: true,
        topic: true,
        correct: true,
        createdAt: true,
      },
    });

    if (!problem) return res.status(404).json({ error: "Problem not found" });
    return res.json({ problem });
  } catch (err) {
    logger.error("getProblem error", err);
    next(err);
  }
};

export const getWeakTopics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.clerkAuth!.userId;
  const since = subDays(new Date(), 7);

  try {
    const problems = await prisma.problem.findMany({
      where: { userId, createdAt: { gte: since }, topic: { not: null } },
      select: { topic: true, correct: true, subject: true },
    });

    const topicMap: Record<
      string,
      { subject: string; total: number; correct: number }
    > = {};

    for (const p of problems) {
      if (!p.topic) continue;
      if (!topicMap[p.topic]) {
        topicMap[p.topic] = { subject: p.subject, total: 0, correct: 0 };
      }
      topicMap[p.topic].total++;
      if (p.correct === true) topicMap[p.topic].correct++;
    }

    const weakTopics = Object.entries(topicMap)
      .map(([topic, data]) => ({
        topic,
        subject: data.subject,
        accuracy: Math.round((data.correct / data.total) * 100),
        total: data.total,
      }))
      .filter((t) => t.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return res.json({ weakTopics });
  } catch (err) {
    logger.error("getWeakTopics error", err);
    next(err);
  }
};

export const getStreakCalendar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.clerkAuth!.userId;

  try {
    const days = Array.from({ length: 7 }, (_, i) =>
      startOfDay(subDays(new Date(), 6 - i))
    );

    const problems = await prisma.problem.findMany({
      where: { userId, createdAt: { gte: days[0] } },
      select: { createdAt: true },
    });

    const typedProblems = problems as Array<{ createdAt: Date }>;
    const activeDays = new Set(
      typedProblems.map((p) => format(p.createdAt, "yyyy-MM-dd"))
    );

    const calendar = days.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      active: activeDays.has(format(day, "yyyy-MM-dd")),
    }));

    return res.json({ calendar });
  } catch (err) {
    logger.error("getStreakCalendar error", err);
    next(err);
  }
};
