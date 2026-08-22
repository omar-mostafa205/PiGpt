/**
 * Design tokens taken verbatim from the PiGPT design canvas
 * (claude.ai/design — "Mobile app onboarding design", PiGPT App.dc.html).
 *
 * Values are literal from the spec so screens can be checked against it.
 * Light mode only, no emoji — per the design's own note.
 */

export const T = {
  blue: "#2f80ed",
  blueDim: "#a9bdea", // CTA background before the step is answered
  blueSend: "#c4d9f6", // send button before the composer has text

  ink: "#0b0d12",
  ink2: "#15181f",
  ink3: "#2b3140", // onboarding title
  body: "#3c4149",
  body2: "#5b6069",
  muted: "#6b7280",
  muted2: "#8b9099",
  muted3: "#9aa0a8",
  muted4: "#9aa0aa", // onboarding subtitle / option sub
  faint: "#b6bac0",

  white: "#ffffff",
  canvas: "#f7f8fa", // quiz + progress page background
  surfaceAlt: "#fafbfc", // quick prompt / thinking bubble
  tintBg: "#f4f9ff", // final-answer panel
  tintBg2: "#e8f1fe", // topic chip
  tintBg3: "#f2f7ff", // selected option card
  chipBg: "#f1f2f5", // segmented control track
  keyBg: "#f0f2f5", // step number chip

  border: "#eef0f3",
  border2: "#e9ebef",
  border3: "#e4e7eb",
  border4: "#e6e8ec",
  track: "#f0f1f4",
  segEmpty: "#e2e5ee",
  tintBorder: "#dfeaf9",

  good: "#4caf72",
  goodBg: "#f1faf3",
  goodFg: "#2f8f52",
  bad: "#d9705a",
  badBg: "#fdf2f0",
  badFg: "#c9503a",
  weakBg: "#fdf0ee",

  // Progress: accuracy bar colours
  barMath: "#2f80ed",
  barPhysics: "#7b61d9",
  barChemistry: "#3f9e6b",
  barStatistics: "#d99a3f",

  iconGoodBg: "#eef7f1",
  iconGoodFg: "#3f9e6b",
} as const;

/** Onboarding page gradient: linear-gradient(180deg,#f8f9fc,#f1f3f9 55%,#e9ecf6) */
export const ONBOARDING_GRADIENT = ["#f8f9fc", "#f1f3f9", "#e9ecf6"] as const;
export const ONBOARDING_GRADIENT_STOPS = [0, 0.55, 1] as const;

/**
 * The design uses Georgia italic for every piece of maths, which is what gives
 * equations their textbook look. Keep this in one place so it stays consistent.
 */
export const SERIF = "Georgia";

export const radius = {
  option: 14,
  card: 16,
  cardLg: 18,
  bubble: 18,
  pill: 26,
  sheet: 22,
} as const;
