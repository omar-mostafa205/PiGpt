export interface ParsedAIResponse {
  topic: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  tip: string;
}

/**
 * Parses the AI model's structured markdown response into typed fields.
 * Falls back gracefully when the model deviates from the format.
 */
export function parseAIResponse(raw: string): ParsedAIResponse {
  // ── Topic ────────────────────────────────────────────────────────────────
  const topicMatch = raw.match(/\*\*Topic:\*\*\s*(.+)/i);
  const topic = topicMatch ? topicMatch[1].trim() : "General";

  // ── Steps ────────────────────────────────────────────────────────────────
  // Match **Step N — Title** followed by content until the next **Step or ✅
  const stepRegex = /\*\*Step\s+\d+\s*[—–-]\s*([^\n*]+)\*\*\n([\s\S]*?)(?=\*\*Step|\✅|💡|$)/gi;
  const steps: { title: string; content: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = stepRegex.exec(raw)) !== null) {
    steps.push({
      title: match[1].trim(),
      content: match[2].trim(),
    });
  }

  // ── Final Answer ─────────────────────────────────────────────────────────
  const answerMatch = raw.match(/\*\*Final Answer:\*\*\s*(.+)/i);
  const finalAnswer = answerMatch
    ? answerMatch[1].trim()
    : extractFallbackAnswer(raw);

  // ── Tip ──────────────────────────────────────────────────────────────────
  const tipMatch = raw.match(/\*\*Tip:\*\*\s*([\s\S]+?)$/i);
  const tip = tipMatch ? tipMatch[1].trim() : "";

  return { topic, steps, finalAnswer, tip };
}

/** Last resort — grab last non-empty line as "answer" */
function extractFallbackAnswer(raw: string): string {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[lines.length - 1] ?? raw.slice(0, 200);
}
