import { apiClient } from "./client";
import type { Quiz, QuizResult, QuizHistoryItem, Subject, Difficulty } from "../../types";

export const quizApi = {
  generate: async (params: {
    subject: Subject;
    topic: string;
    difficulty: Difficulty;
    questionCount?: number;
  }): Promise<{ quiz: Quiz }> => {
    // Backend: POST /api/quiz
    const { data } = await apiClient.post("/api/quiz", params);
    return data;
  },

  submit: async (params: {
    subject: Subject;
    difficulty: Difficulty;
    topic: string;
    questions: string[];
    score: number;
  }): Promise<QuizResult> => {
    const { data } = await apiClient.post<QuizResult>("/api/quiz/submit", params);
    return data;
  },

  getHistory: async (): Promise<{ quizzes: QuizHistoryItem[] }> => {
    const { data } = await apiClient.get("/api/quiz/history");
    return data;
  },
};
