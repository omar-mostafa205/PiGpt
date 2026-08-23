import type { Request, Response } from "express";
import { z } from "zod";
import { streamAI } from "../services/ai/provider.js";
import { buildPrompt } from "../services/ai/buildPrompt.js";
import { parseAIResponse } from "../services/ai/parseResponse.js";
import { prisma } from "../services/storage/neonStorage.js";
import { upsertProgress } from "../services/storage/neonStorage.js";
import { logger } from "../utils/logger.js";

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

  // Persist the turn up front so the conversation exists even if this dies.
  const problem = await prisma.problem.create({
    data: { userId, subject, question, answer: "", topic: null, correct: null },
  });
  send({ type: "problem", problemId: problem.id });

  let answer = "";

  try {
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
      await prisma.problem.update({
        where: { id: problem.id },
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
