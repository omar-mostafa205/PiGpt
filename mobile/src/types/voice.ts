export interface LectureSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  followUps: string[];
}

export type RecorderStatus = "idle" | "recording" | "recorded" | "summarising";

/** A summary saved to the database. */
export interface LectureNote {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  followUps: string[];
  subject: import("./chat").Subject | null;
  durationMs: number;
  createdAt: string;
}
