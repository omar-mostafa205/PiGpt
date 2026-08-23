import { GoogleGenAI, ThinkingLevel, type Content, type Part } from "@google/genai";
import { env } from "../../config/env.js";
import type { AIMessage, AIRequest } from "./types.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * gemini-2.5-flash was retired for new API users and 404s. gemini-3.6-flash is
 * the replacement the API itself points at; override with GEMINI_MODEL.
 *
 * Gemini is now only used where OpenRouter cannot help: audio input, which
 * OpenRouter charges for even on free models.
 */
const MODEL = env.GEMINI_MODEL;

function toContents(messages: AIMessage[]): Content[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: m.parts.map((p): Part => {
      if (p.kind === "text") return { text: p.text };
      return { inlineData: { data: p.base64, mimeType: p.mimeType } };
    }),
  }));
}

export async function callGemini({
  systemPrompt,
  messages,
  maxTokens = 2000,
}: AIRequest): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: toContents(messages),
    config: { systemInstruction: systemPrompt, maxOutputTokens: maxTokens },
  });

  if (!response.text) {
    const reason = response.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`Gemini returned no text content (finishReason: ${reason})`);
  }
  return response.text;
}

/** Streaming variant — yields text deltas as they arrive. */
export async function* streamGemini({
  systemPrompt,
  messages,
  maxTokens = 2000,
}: AIRequest): AsyncGenerator<string> {
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: toContents(messages),
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      // Thinking runs before any text is emitted, so it sets time to first
      // token. LOW keeps step quality while roughly halving the wait.
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}
