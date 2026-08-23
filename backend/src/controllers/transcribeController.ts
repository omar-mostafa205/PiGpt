import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { callAI } from "../services/ai/provider.js";
import { audio, text as textPart } from "../services/ai/types.js";
import { logger } from "../utils/logger.js";

const schema = z.object({
  audioBase64: z.string().min(100).max(34_000_000),
  mimeType: z.enum(["audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/webm"]),
});

const SYSTEM_PROMPT = `You transcribe a student speaking a question aloud.
Return ONLY the transcription as plain text — no quotes, no preamble, no
markdown. Write spoken maths in normal notation (say "x squared" as x^2,
"integral of" as ∫). If there is no discernible speech, return an empty string.`;

/** Speech to text for the composer's dictation button. */
export const transcribeController = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { audioBase64, mimeType } = parsed.data;

  try {
    const raw = await callAI({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          parts: [audio(audioBase64, mimeType), textPart("Transcribe this.")],
        },
      ],
      maxTokens: 1200,
    });

    const text = raw.trim().replace(/^["']|["']$/g, "");
    logger.info(`Transcribe OK | chars=${text.length}`);
    return res.json({ text });
  } catch (err) {
    logger.error("transcribe error", err);
    next(err);
  }
};
