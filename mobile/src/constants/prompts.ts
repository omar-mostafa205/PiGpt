import type { Subject } from "../types";

export interface QuickPrompt {
  /** Shown in Georgia italic, the way the design sets every equation. */
  eq: string;
  topic: string;
  /** What actually gets sent to the solver. */
  send: string;
}

/**
 * The math set is verbatim from the design canvas; the other subjects follow
 * the same equation-plus-topic shape.
 */
export const QUICK_PROMPTS: Record<Subject, QuickPrompt[]> = {
  math: [
    { eq: "∫ x·eˣ dx", topic: "Integration by parts", send: "Integrate x·eˣ dx" },
    { eq: "lim(x→0) sin x / x", topic: "Limits", send: "Find lim(x→0) sin x / x" },
    { eq: "d/dx ln(3x²)", topic: "Derivatives", send: "Differentiate ln(3x²)" },
    { eq: "Σ n² from 1 to 10", topic: "Series", send: "Evaluate the sum of n² from 1 to 10" },
  ],
  physics: [
    { eq: "F = ma", topic: "Newton's second law", send: "Explain Newton's second law, F = ma" },
    { eq: "½mv² at v = 10 m/s", topic: "Kinetic energy", send: "Calculate kinetic energy at v = 10 m/s" },
    { eq: "V = IR", topic: "Ohm's law", send: "Explain Ohm's law: V = IR" },
    { eq: "h = v²sin²θ / 2g", topic: "Projectile motion", send: "Find the maximum height of a projectile" },
  ],
  chemistry: [
    { eq: "CH₄ + O₂ → CO₂ + H₂O", topic: "Balancing equations", send: "Balance CH₄ + O₂ → CO₂ + H₂O" },
    { eq: "0.5 mol in 250 mL", topic: "Molarity", send: "Find the molarity of 0.5 mol in 250 mL" },
    { eq: "H₂O", topic: "Lewis structures", send: "Draw the Lewis structure of H₂O" },
    { eq: "pH of 0.01 M HCl", topic: "Acids and bases", send: "Find the pH of 0.01 M HCl" },
  ],
  accounting: [
    { eq: "Dr / Cr", topic: "Double-entry basics", send: "Explain debits versus credits" },
    { eq: "A = L + E", topic: "Accounting equation", send: "Explain Assets = Liabilities + Equity" },
    { eq: "Revenue − Expenses", topic: "Income statement", send: "Calculate net income from revenue and expenses" },
    { eq: "Trial balance", topic: "Period close", send: "Explain how a trial balance is prepared" },
  ],
};
