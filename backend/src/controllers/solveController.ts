import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { callAI } from "../services/ai/provider.js";
import { buildPrompt } from "../services/ai/buildPrompt.js";
import { parseAIResponse } from "../services/ai/parseResponse.js";
import { saveProblem, upsertProgress } from "../services/storage/neonStorage.js";
import { logger } from "../utils/logger.js";
import type { SolveRequest } from "../types/index.js";

const solveSchema = z.object({
  question: z.string().min(1).max(5000),
  subject: z.enum(["math", "physics", "chemistry", "accounting"]),
  imageBase64: z.string().optional(),
  gradeLevel: z
    .enum(["middle_school", "high_school", "ap_ib", "university", "self_study"])
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .optional()
    .default([]),
});

export const solveController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Validate body
  const parsed = solveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { question, subject, imageBase64, gradeLevel, history } =
    parsed.data as SolveRequest;
  const userId = req.clerkAuth!.userId;

  try {
    // 2. Build the prompt
    const { systemPrompt, messages } = buildPrompt({
      question,
      subject,
      gradeLevel,
      history,
      imageBase64,
    });

    // 3. Call Gemini
    const rawResponse = await callAI({ systemPrompt, messages });

    // 4. Parse structured response
    const parsedResponse = parseAIResponse(rawResponse);

    // 5. Persist to NeonDB
    const problem = await saveProblem({
      userId,
      subject,
      question,
      answer: rawResponse,
      topic: parsedResponse.topic,
      correct: null,
    });

    await upsertProgress({ userId, subject });

    logger.info(
      `Solve OK | user=${userId} subject=${subject} problemId=${problem.id}`
    );

    return res.json({
      problemId: problem.id,
      steps: parsedResponse.steps,
      finalAnswer: parsedResponse.finalAnswer,
      tip: parsedResponse.tip,
      topic: parsedResponse.topic,
      raw: rawResponse,
    });
  } catch (err) {
    next(err);
  }
};
