import { env } from "../../config/env.js";
import type { AIMessage, AIRequest } from "./types.js";

const URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * OpenRouter client, OpenAI-compatible.
 *
 * Model default is nvidia/nemotron-3-nano-omni, chosen because it is free and
 * accepts both text and images, which covers solving, photo solving and quiz
 * generation. Audio is deliberately not routed here: OpenRouter requires a
 * credit balance for audio input regardless of the model being free.
 */
const MODEL = env.OPENROUTER_MODEL;

/** OpenAI-style content parts. */
type OpenAIContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContent[];
}

function toOpenAI(systemPrompt: string, messages: AIMessage[]): OpenAIMessage[] {
  const out: OpenAIMessage[] = [{ role: "system", content: systemPrompt }];

  for (const m of messages) {
    const parts: OpenAIContent[] = [];
    for (const p of m.parts) {
      if (p.kind === "text") parts.push({ type: "text", text: p.text });
      else if (p.kind === "image") {
        parts.push({ type: "image_url", image_url: { url: `data:${p.mimeType};base64,${p.base64}` } });
      }
      // Audio never reaches this adapter; see the note above.
    }

    // Collapse a lone text part so simple turns stay simple.
    const only = parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts;
    out.push({ role: m.role, content: only });
  }

  return out;
}

const headers = () => ({
  Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  // OpenRouter uses these for attribution on its dashboards.
  "HTTP-Referer": "https://github.com/omar-mostafa205/PiGpt",
  "X-Title": "PiGPT",
});

/** Read an error body without letting a non-JSON response throw. */
async function errorFrom(res: Response): Promise<Error> {
  const body = await res.text();
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const message = parsed.error?.message ?? body;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    return err;
  } catch {
    const err = new Error(body.slice(0, 300) || `Request failed (${res.status})`) as Error & {
      status?: number;
    };
    err.status = res.status;
    return err;
  }
}

export async function callOpenRouter({
  systemPrompt,
  messages,
  maxTokens = 2000,
}: AIRequest): Promise<string> {
  const res = await fetch(URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      // Nemotron is a reasoning model: it emits hidden reasoning tokens before
      // any content, and on a long prompt that consumed the whole budget and
      // returned an empty answer. The visible steps are the product here, so
      // the private reasoning pass is not wanted.
      reasoning: { enabled: false },
      messages: toOpenAI(systemPrompt, messages),
    }),
  });

  if (!res.ok) throw await errorFrom(res);

  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    error?: { message?: string };
  };

  if (data.error) throw new Error(data.error.message ?? "OpenRouter error");

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(
      `OpenRouter returned no text (finishReason: ${data.choices?.[0]?.finish_reason ?? "unknown"})`
    );
  }
  return content;
}

/**
 * Streaming variant. OpenRouter sends server-sent events: `data: {json}` lines,
 * terminated by `data: [DONE]`, interleaved with `:` comment lines used as
 * keep-alives — those must be skipped rather than parsed.
 */
export async function* streamOpenRouter({
  systemPrompt,
  messages,
  maxTokens = 2000,
}: AIRequest): AsyncGenerator<string> {
  const res = await fetch(URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      stream: true,
      reasoning: { enabled: false },
      messages: toOpenAI(systemPrompt, messages),
    }),
  });

  if (!res.ok) throw await errorFrom(res);
  if (!res.body) throw new Error("OpenRouter returned no response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");

      if (!line || line.startsWith(":")) continue; // keep-alive
      if (!line.startsWith("data:")) continue;

      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const chunk = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
          error?: { message?: string };
        };
        if (chunk.error) throw new Error(chunk.error.message ?? "OpenRouter stream error");
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch (err) {
        // A malformed keep-alive should not kill the stream, but a real error
        // carried in the payload should surface.
        if (err instanceof Error && err.message.includes("OpenRouter")) throw err;
      }
    }
  }
}
