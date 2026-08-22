import type { Content } from "@google/genai";

type Subject = "math" | "physics" | "chemistry" | "accounting";
type GradeLevel =
  | "middle_school"
  | "high_school"
  | "ap_ib"
  | "university"
  | "self_study";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface BuildPromptOptions {
  question: string;
  subject: Subject;
  gradeLevel?: GradeLevel;
  history?: HistoryMessage[];
  imageBase64?: string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
}

interface BuiltPrompt {
  systemPrompt: string;
  messages: Content[];
}

// ── Per-subject personas ───────────────────────────────────────────────────
const SUBJECT_PERSONA: Record<Subject, string> = {
  math: "You are an expert math tutor. You excel at algebra, calculus, statistics, geometry, and discrete mathematics.",
  physics:
    "You are an expert physics professor. You master classical mechanics, thermodynamics, electromagnetism, quantum mechanics, and relativity.",
  chemistry:
    "You are an expert chemistry tutor. You specialise in stoichiometry, organic chemistry, thermochemistry, electrochemistry, and chemical kinetics.",
  accounting:
    "You are an expert accounting tutor. You cover financial accounting, managerial accounting, tax accounting, and financial analysis.",
};

// ── Grade-level calibration addendum ──────────────────────────────────────
const GRADE_INSTRUCTIONS: Record<GradeLevel, string> = {
  middle_school:
    "Explain with very simple language and analogies. Avoid advanced terminology. Use real-world examples a 12-year-old would recognise.",
  high_school:
    "Use clear, accessible language. Introduce formal notation but always explain it. Assume basic algebra knowledge.",
  ap_ib: "Assume solid foundational knowledge. Use appropriate mathematical rigour. AP/IB exam style explanations.",
  university:
    "Use full mathematical rigour. Reference relevant theorems. Expect undergraduate-level prior knowledge.",
  self_study:
    "Explain clearly and thoroughly. Do not assume prior knowledge but treat the student as a capable adult.",
};

// ── Shared output format instructions ─────────────────────────────────────
const FORMAT_INSTRUCTIONS = `
FIRST, decide whether the message is actually a question or problem to solve.

If it is NOT — it is blank, a stray character or two ("Bb", "asdf"), a greeting,
or too vague to tell what is being asked — then do NOT use the structure below,
do NOT invent a topic, and do NOT guess what they meant. Reply with one or two
short sentences asking what they would like help with, and give one concrete
example of a question you could answer for this subject. Never present a guess
as though it were their question.

Otherwise, respond in this exact structure:

**Topic:** [Identify the specific sub-topic, e.g. "Calculus — Integration by Parts"]

**Step 1 — [Short title]**
[Explanation and working]

**Step 2 — [Short title]**
[Explanation and working]

... (as many steps as needed)

**Final Answer:** [Clear, concise final answer]

**Tip:** [A related concept or follow-up insight to deepen understanding]

Use proper mathematical notation throughout: ², √, ∫, π, Σ, Δ, ∞, etc.
Explain the *why* behind each step, not just the calculation.
If part of the question is genuinely ambiguous, solve the most reasonable
reading and say plainly which reading you took.
`.trim();

// ── Builder ────────────────────────────────────────────────────────────────
export function buildPrompt({
  question,
  subject,
  gradeLevel = "high_school",
  history = [],
  imageBase64,
  mimeType = "image/jpeg",
}: BuildPromptOptions): BuiltPrompt {
  const systemPrompt = [
    SUBJECT_PERSONA[subject],
    GRADE_INSTRUCTIONS[gradeLevel],
    FORMAT_INSTRUCTIONS,
  ].join("\n\n");

  const messages: Content[] = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    imageBase64
      ? {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: question },
          ],
        }
      : { role: "user", parts: [{ text: question }] },
  ];

  return { systemPrompt, messages };
}
