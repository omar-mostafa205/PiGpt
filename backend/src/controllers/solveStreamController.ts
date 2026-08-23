import type { Request, Response } from "express";
import { z } from "zod";
import { streamAI } from "../services/ai/provider.js";
import { buildPrompt } from "../services/ai/buildPrompt.js";
import { parseAIResponse } from "../services/ai/parseResponse.js";
import { prisma } from "../services/storage/neonStorage.js";
import { upsertProgress } from "../services/storage/neonStorage.js";
import { logger } from "../utils/logger.js";
import { ensureUser } from "../services/storage/ensureUser.js";

const solveSchema = z.object({
  question: z.string().min(1).max(5000),
  subject: z.enum(["math", "physics", "chemistry", "accounting"]),
  imageBase64: z.string().optional(),
  gradeLevel: z
    .enum(["middle_school", "high_school", "ap_ib", "university", "self_study"])
    .optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional()
    .default([]),
});

/**
 * Streaming counterpart to /api/solve.
 *
 * Emits NDJSON, one JSON object per line:
 *   {"type":"problem","problemId":"…"}   once, before any text
 *   {"type":"text","value":"…"}          for every model delta
 *   {"type":"done","topic":"…"}          once, at the end
 *   {"type":"error","message":"…"}       if the model call fails
 *
 * The Problem row is written *before* streaming and finished in a `finally`, so
 * an abandoned or failed stream still leaves the turn saved in history.
 */
export const solveStreamController = async (req: Request, res: Response) => {
  const parsed = solveSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { question, subject, imageBase64, gradeLevel, history } = parsed.data;
  const userId = req.clerkAuth!.userId;

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Connection", "keep-alive");
  // Stops nginx and friends from buffering the whole response.
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (event: Record<string, unknown>) => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  /**
   * Insert the turn. A foreign key violation means the User row is missing —
   * it can be deleted straight from the database — so recreate it and retry
   * once rather than failing the whole request.
   */
  const createProblem = async (): Promise<string> => {
    const data = { userId, subject, question, answer: "", topic: null, correct: null };
    try {
      return (await prisma.problem.create({ data })).id;
    } catch (err) {
      if ((err as { code?: string })?.code !== "P2003") throw err;
      logger.warn(`Missing User row, recreating | id=${userId}`);
      await ensureUser(userId, true);
      return (await prisma.problem.create({ data })).id;
    }
  };

  let answer = "";
  let problemId: string | null = null;

  try {
    // Persist the turn up front so the conversation exists even if this dies.
    // Inside the try: headers are already flushed, so a throw here would reach
    // Express and corrupt the stream instead of reporting a usable error.
    problemId = await createProblem();
    send({ type: "problem", problemId });

    const { systemPrompt, messages } = buildPrompt({
      question,
      subject,
      gradeLevel,
      history,
      imageBase64,
    });

    for await (const delta of streamAI({ systemPrompt, messages })) {
      answer += delta;
      send({ type: "text", value: delta });
    }
  } catch (err) {
    logger.error("solve stream error", err);
    const quota =
      (err as any)?.status === 429 ||
      /RESOURCE_EXHAUSTED|exceeded your current quota/i.test(String((err as any)?.message ?? ""));
    send({
      type: "error",
      message: quota
        ? "Rate limited by the AI service — the Gemini free tier allows only a few requests per day. Try again shortly."
        : "AI service temporarily unavailable",
    });
  } finally {
    // Runs on success, failure and client abort alike.
    const { topic, finalAnswer } = parseAIResponse(answer);
    try {
      if (problemId) await prisma.problem.update({
        where: { id: problemId },
        // Store the whole reply so the conversation can be reopened intact;
        // `topic` carries the short label for lists.
        data: { answer: answer || finalAnswer, topic },
      });
      await upsertProgress({ userId, subject });
    } catch (e) {
      logger.warn("solve stream persist failed", { error: (e as Error).message });
    }

    send({ type: "done", topic });
    res.end();
    logger.info(`Solve stream done | user=${userId} chars=${answer.length}`);
  }
};
