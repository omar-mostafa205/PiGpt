import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { callGemini } from "../services/ai/gemini.js";
import { prisma } from "../services/storage/neonStorage.js";
import { logger } from "../utils/logger.js";
import type { Subject, Difficulty } from "@prisma/client";

// ── Generate Quiz ──────────────────────────────────────────────────────────
const generateSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry", "accounting"]),
  topic: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().int().min(5).max(30).default(10),
});

export const generateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { subject, topic, difficulty, questionCount } = parsed.data;

  const systemPrompt = `You are a ${subject} quiz generator. 
Return ONLY a valid JSON object — no markdown, no commentary.
Schema:
{
  "title": string,
  "questions": [
    {
      "id": number,
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": number (0-3),
      "explanation": string
    }
  ]
}`;

  const userMessage = `Generate a ${difficulty} ${subject} quiz on "${topic}" with ${questionCount} multiple-choice questions.`;

  try {
    const raw = await callGemini({
      systemPrompt,
      messages: [{ role: "user", parts: [{ text: userMessage }] }],
      maxTokens: 4000,
    });

    const quiz = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.json({ quiz });
  } catch (err) {
    logger.error("generateQuiz error", err);
    next(err);
  }
};

// ── Submit Completed Quiz ──────────────────────────────────────────────────
const submitSchema = z.object({
  subject: z.enum(["math", "physics", "chemistry", "accounting"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().min(1).max(200).default("General practice"),
  questions: z.array(z.string()),
  score: z.number().min(0).max(100),
});

export const submitQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const userId = req.clerkAuth!.userId;
  const { subject, difficulty, topic, questions, score } = parsed.data as {
    subject: Subject;
    difficulty: Difficulty;
    topic: string;
    questions: string[];
    score: number;
  };

  try {
    const quiz = await prisma.quiz.create({
      data: { userId, subject, difficulty, topic, questions, score, completedAt: new Date() },
    });

    await updateSubjectAccuracy(userId, subject);

    return res.json({ quizId: quiz.id, score });
  } catch (err) {
    logger.error("submitQuiz error", err);
    next(err);
  }
};

// ── Quiz History ───────────────────────────────────────────────────────────
export const getQuizHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.clerkAuth!.userId;

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: { id: true, subject: true, topic: true, difficulty: true, score: true, completedAt: true },
    });

    return res.json({ quizzes });
  } catch (err) {
    logger.error("getQuizHistory error", err);
    next(err);
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
async function updateSubjectAccuracy(userId: string, subject: Subject) {
  const quizzes = await prisma.quiz.findMany({
    where: { userId, subject },
    select: { score: true },
  });

  const typedQuizzes = quizzes as Array<{ score: number }>;
  if (typedQuizzes.length === 0) return;

  const avg = Math.round(
    typedQuizzes.reduce<number>((acc, q) => acc + q.score, 0) /
      typedQuizzes.length
  );

  await prisma.progress.upsert({
    where: { userId_subject: { userId, subject } },
    update: { accuracy: avg, updatedAt: new Date() },
    create: {
      userId,
      subject,
      accuracy: avg,
      streak: 0,
      totalSolved: typedQuizzes.length,
    },
  });
}
