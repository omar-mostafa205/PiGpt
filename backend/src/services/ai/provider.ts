import { callOpenRouter, streamOpenRouter } from "./openrouter.js";
import { callGemini, streamGemini } from "./gemini.js";
import { hasAudio, type AIRequest } from "./types.js";
import { logger } from "../../utils/logger.js";

/**
 * Chooses a provider per request.
 *
 * OpenRouter serves text and images on a free model. Audio goes to Gemini,
 * because OpenRouter rejects audio input without a credit balance:
 *   402 "This request requires at least $0.50 in balance for audio"
 *
 * Set AI_PROVIDER=gemini to force everything through Gemini.
 */
const forceGemini = process.env.AI_PROVIDER === "gemini";

const useGemini = (req: AIRequest) => forceGemini || hasAudio(req.messages);

export async function callAI(req: AIRequest): Promise<string> {
  if (useGemini(req)) {
    logger.info("AI call | provider=gemini (audio)");
    return callGemini(req);
  }
  return callOpenRouter(req);
}

export async function* streamAI(req: AIRequest): AsyncGenerator<string> {
  if (useGemini(req)) {
    yield* streamGemini(req);
    return;
  }
  yield* streamOpenRouter(req);
}
