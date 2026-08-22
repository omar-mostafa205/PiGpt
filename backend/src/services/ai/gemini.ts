import { GoogleGenAI, ThinkingLevel, type Content, type Part } from "@google/genai";
import { env } from "../../config/env.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * gemini-2.5-flash was retired for new API users and now 404s with
 * "no longer available to new users". gemini-3.6-flash is the replacement the
 * API itself points at; override with GEMINI_MODEL if needed.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

interface CallGeminiOptions {
  systemPrompt: string;
  messages: Content[];
  maxTokens?: number;
}
export async function callGemini({
  systemPrompt,
  messages,
  maxTokens = 2000,
}: CallGeminiOptions): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: messages,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
    },
  });

  if (!response.text) {
    // Most often the token budget was spent before any text was produced.
    const reason = response.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`Gemini returned no text content (finishReason: ${reason})`);
  }
  return response.text;
}

/**
 * Streaming variant of {@link callGemini} — yields text deltas as they arrive
 * so the client can render tokens progressively.
 */
export async function* streamGemini({
  systemPrompt,
  messages,
  maxTokens = 2000,
}: CallGeminiOptions): AsyncGenerator<string> {
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: messages,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: maxTokens,
      // Thinking runs before any text is emitted, so it directly sets
      // time-to-first-token. LOW keeps step quality while roughly halving the
      // wait before words start appearing.
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/** Build a user message that may include a base64 image block */
export function buildImageMessage(
  text: string,
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg"
): Content {
  return {
    role: "user",
    parts: [
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      } satisfies Part,
      { text } satisfies Part,
    ],
  };
}

/** Build a plain text user message */
export function buildTextMessage(text: string): Content {
  return {
    role: "user",
    parts: [{ text } satisfies Part],
  };
}

/** Build a plain text assistant/model message (for conversation history) */
export function buildModelMessage(text: string): Content {
  return {
    role: "model",
    parts: [{ text } satisfies Part],
  };
}
