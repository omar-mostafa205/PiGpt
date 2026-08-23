/**
 * Provider-neutral message shape.
 *
 * The app talks to two providers: OpenRouter for text and images (free), and
 * Gemini for audio (OpenRouter requires a credit balance for audio input).
 * Prompts are built once in this shape and converted by each adapter, so a
 * controller never needs to know which provider will serve it.
 */

export type AIPart =
  | { kind: "text"; text: string }
  | { kind: "image"; base64: string; mimeType: string }
  | { kind: "audio"; base64: string; mimeType: string };

export interface AIMessage {
  role: "user" | "assistant";
  parts: AIPart[];
}

export interface AIRequest {
  systemPrompt: string;
  messages: AIMessage[];
  maxTokens?: number;
}

export const text = (t: string): AIPart => ({ kind: "text", text: t });

export const image = (base64: string, mimeType = "image/jpeg"): AIPart => ({
  kind: "image",
  base64,
  mimeType,
});

export const audio = (base64: string, mimeType: string): AIPart => ({
  kind: "audio",
  base64,
  mimeType,
});

/** Audio has to go to Gemini; everything else can use the free provider. */
export const hasAudio = (messages: AIMessage[]): boolean =>
  messages.some((m) => m.parts.some((p) => p.kind === "audio"));
