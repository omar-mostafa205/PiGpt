import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import type { Subject } from "@prisma/client";

import { logger } from "../../utils/logger.js";

const adapter = new PrismaNeon({
  connectionString: process.env.DIRECT_URL,
});

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
});
// ── Problem ────────────────────────────────────────────────────────────────
interface SaveProblemArgs {
  userId: string;
  subject: Subject;
  question: string;
  answer: string;
  topic: string;
  correct: boolean | null;
}

export async function saveProblem(args: SaveProblemArgs) {
  const problem = await prisma.problem.create({ data: args });
  logger.info(`Problem saved | id=${problem.id} subject=${args.subject}`);
  return problem;
}

// ── Progress ───────────────────────────────────────────────────────────────
interface UpsertProgressArgs {
  userId: string;
  subject: Subject;
}

export async function upsertProgress({ userId, subject }: UpsertProgressArgs) {
  // Recalculate accuracy and streak from raw Problem records
  const problems = await prisma.problem.findMany({
    where: { userId, subject },
    select: { correct: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const typedProblems = problems as Array<{ correct: boolean | null; createdAt: Date }>;
  const graded = typedProblems.filter((p) => p.correct !== null);
  const correctCount = graded.filter((p) => p.correct === true).length;
  const accuracy =
    graded.length > 0 ? Math.round((correctCount / graded.length) * 100) : 0;

  // Streak: count consecutive calendar days (most recent day last)
  const streak = calculateStreak(typedProblems.map((p) => p.createdAt));

  await prisma.progress.upsert({
    where: { userId_subject: { userId, subject } },
    update: { accuracy, streak, totalSolved: problems.length, updatedAt: new Date() },
    create: { userId, subject, accuracy, streak, totalSolved: problems.length },
  });
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const uniqueDays = [
    ...new Set(dates.map((d) => d.toISOString().slice(0, 10))),
  ].sort();

  let streak = 1;
  const today = new Date().toISOString().slice(0, 10);

  // Streak only counts if the user solved something today or yesterday
  const lastDay = uniqueDays[uniqueDays.length - 1];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (lastDay !== today && lastDay !== yesterday) return 0;

  for (let i = uniqueDays.length - 1; i > 0; i--) {
    const curr = new Date(uniqueDays[i]);
    const prev = new Date(uniqueDays[i - 1]);
    const diffDays = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diffDays === 1) streak++;
    else break;
  }

  return streak;
}
