import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { callGemini } from "../services/ai/gemini.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../services/storage/neonStorage.js";

// Roughly 25 MB of base64 — Gemini takes inline audio well below the request cap.
const MAX_AUDIO_CHARS = 34_000_000;

const summarizeSchema = z.object({
  audioBase64: z.string().min(100).max(MAX_AUDIO_CHARS),
  mimeType: z.enum(["audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/webm"]),
  subject: z.enum(["math", "physics", "chemistry", "accounting"]).optional(),
  /** Length of the recording, so the saved note can show it. */
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional().default(0),
});

const SYSTEM_PROMPT = `You summarise recorded lessons for a student.
Listen to the audio, then return ONLY a valid JSON object — no markdown, no commentary.
Schema:
{
  "title": string,          // short lecture title
  "summary": string,        // 3-5 sentence overview
  "keyPoints": string[],    // 4-8 concrete takeaways
  "topics": string[],       // 2-5 topic labels, e.g. "Integration by parts"
  "followUps": string[]     // 2-4 questions the student should be able to answer
}
If the audio has no discernible speech, return the same shape with an empty
keyPoints array and a summary explaining that nothing could be heard.`;

export const summarizeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parsed = summarizeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { audioBase64, mimeType, subject, durationMs } = parsed.data;
  const userId = req.clerkAuth!.userId;

  try {
    const raw = await callGemini({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          parts: [
            { inlineData: { data: audioBase64, mimeType } },
            {
              text: subject
                ? `Summarise this ${subject} lecture recording.`
                : "Summarise this lecture recording.",
            },
          ],
        },
      ],
      maxTokens: 3000,
    });

    const summary = JSON.parse(raw.replace(/```json|```/g, "").trim());

    // A summary is only useful if it survives the screen — save it as a note.
    const note = await prisma.note.create({
      data: {
        userId,
        title: String(summary.title ?? "Lecture"),
        summary: String(summary.summary ?? ""),
        keyPoints: Array.isArray(summary.keyPoints) ? summary.keyPoints.map(String) : [],
        topics: Array.isArray(summary.topics) ? summary.topics.map(String) : [],
        followUps: Array.isArray(summary.followUps) ? summary.followUps.map(String) : [],
        subject,
        durationMs,
      },
    });

    logger.info(`Summary saved | user=${userId} note=${note.id}`);
    return res.json({ summary, noteId: note.id });
  } catch (err) {
    logger.error("summarize error", err);
    next(err);
  }
};
