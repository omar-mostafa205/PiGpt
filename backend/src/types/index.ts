// ── Auth ──────────────────────────────────────────────────────────────────
export interface ClerkContext {
  userId: string;
}

// ── Subjects / Difficulty ─────────────────────────────────────────────────
export type Subject = "math" | "physics" | "chemistry" | "accounting";

export type Difficulty = "easy" | "medium" | "hard";

export type GradeLevel =
  | "middle_school"
  | "high_school"
  | "ap_ib"
  | "university"
  | "self_study";

// ── Solve ─────────────────────────────────────────────────────────────────
export interface SolveRequest {
  question: string;
  subject: Subject;
  imageBase64?: string;
  gradeLevel?: GradeLevel;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface SolveResponse {
  problemId: string;
  steps: { title: string; content: string }[];
  finalAnswer: string;
  tip: string;
  topic: string;
  raw: string;
}

// ── Progress ──────────────────────────────────────────────────────────────
export interface SubjectBreakdown {
  subject: Subject;
  accuracy: number;
  totalSolved: number;
  streak: number;
}

export interface ProgressResponse {
  weeklyProblems: number;
  accuracy: number;
  streak: number;
  subjectBreakdown: SubjectBreakdown[];
}

export interface WeakTopic {
  topic: string;
  subject: Subject;
  accuracy: number;
  total: number;
}

export interface StreakDay {
  date: string; // "YYYY-MM-DD"
  active: boolean;
}

// ── Problem record (returned from API) ───────────────────────────────────
export interface ProblemRecord {
  id: string;
  subject: Subject;
  question: string;
  topic: string | null;
  correct: boolean | null;
  createdAt: string;
}

// ── Quiz ──────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizSubmission {
  subject: Subject;
  difficulty: Difficulty;
  questions: string[];
  score: number;
}

export interface QuizHistoryItem {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  score: number;
  completedAt: string | null;
}

// ── Express Request augmentation ──────────────────────────────────────────
// Extends Express's Request type so req.clerkAuth is typed everywhere
declare global {
  namespace Express {
    interface Request {
      clerkAuth?: ClerkContext;
    }
  }
}
