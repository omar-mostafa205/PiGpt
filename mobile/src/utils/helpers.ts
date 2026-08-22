import { Platform } from "react-native";

/** Generate a random UUID-like id */
export const generateId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Truncate a string to maxLen characters with ellipsis */
export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? str.slice(0, maxLen) + "…" : str;

/** Format a date string to "Jan 12" style */
export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Format elapsed seconds to MM:SS */
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/** Convert a base64 data URI to plain base64 string */
export const stripDataUri = (base64: string): string =>
  base64.replace(/^data:[^;]+;base64,/, "");

/** Check whether we are running on iOS */
export const isIOS = Platform.OS === "ios";

/** Clamp a number between min and max */
export const clamp = (val: number, min: number, max: number): number =>
  Math.min(Math.max(val, min), max);

/** Parse AI raw response — strip markdown fences */
export const stripMarkdownFences = (raw: string): string =>
  raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
