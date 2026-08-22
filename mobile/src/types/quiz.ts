import type { Subject } from "./chat";

export type Difficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  quizId: string;
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

export interface PresetQuiz {
  id: string;
  title: string;
  subject: Subject;
  topic: string;
  questionCount: number;
  difficulty: Difficulty;
}

export interface QuizSessionState {
  quiz: Quiz | null;
  currentIndex: number;
  answers: (number | null)[];
  /** Per question: has the answer been checked and the explanation revealed. */
  checked: boolean[];
  startTime: number;
}
