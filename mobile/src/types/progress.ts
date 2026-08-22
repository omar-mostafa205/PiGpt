import type { Subject } from "./chat";

export interface SubjectProgress {
  subject: Subject;
  accuracy: number;
  totalSolved: number;
  streak: number;
}

export interface ProgressData {
  weeklyProblems: number;
  accuracy: number;
  streak: number;
  subjectBreakdown: SubjectProgress[];
}

export interface WeakTopic {
  topic: string;
  subject: Subject;
  accuracy: number;
  total: number;
}

export interface RecentProblem {
  id: string;
  subject: Subject;
  question: string;
  topic: string | null;
  correct: boolean | null;
  createdAt: string;
}

export interface StreakDay {
  date: string;
  active: boolean;
}

export interface PaginatedProblems {
  problems: RecentProblem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** A stored problem with its full answer, used to reopen a past chat. */
export interface SavedProblem {
  id: string;
  subject: Subject;
  question: string;
  answer: string;
  topic: string | null;
  correct: boolean | null;
  createdAt: string;
}
