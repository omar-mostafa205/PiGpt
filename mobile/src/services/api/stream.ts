import { fetch as expoFetch } from "expo/fetch";
import type { SolveRequest } from "../../types";
import { getApiToken } from "./client";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type StreamEvent =
  | { type: "problem"; problemId: string }
  | { type: "text"; value: string }
  | { type: "done"; topic?: string }
  | { type: "error"; message: string };

/**
 * Consumes the NDJSON token stream from POST /api/solve/stream.
 *
 * React Native's global fetch cannot read a response body incrementally;
 * `expo/fetch` can, which is what makes token-by-token rendering possible.
 */
export async function* streamSolve(
  payload: SolveRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const token = await getApiToken();

  const res = await expoFetch(`${BASE_URL}/api/solve/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = String(body.error);
    } catch {
      // Non-JSON error body; keep the status message.
    }
    yield { type: "error", message };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Dispatch only complete lines; keep any partial tail for the next chunk.
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) {
        try {
          yield JSON.parse(line) as StreamEvent;
        } catch {
          // A malformed line should not kill the stream.
        }
      }
      newline = buffer.indexOf("\n");
    }
  }

  const tail = buffer.trim();
  if (tail) {
    try {
      yield JSON.parse(tail) as StreamEvent;
    } catch {
      // ignore
    }
  }
}
