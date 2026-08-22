import { create } from "zustand";
import { quizApi } from "../services/api/quiz";
import type { QuizSessionState, Subject, Difficulty } from "../types";

interface QuizStore {
  session: QuizSessionState;
  isGenerating: boolean;
  error: string | null;

  generateQuiz: (params: {
    subject: Subject;
    topic: string;
    difficulty: Difficulty;
    questionCount?: number;
  }) => Promise<void>;

  /** Record a choice for the current question. */
  answerQuestion: (index: number) => void;
  /** Reveal the explanation for the current question. */
  checkAnswer: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  resetSession: () => void;
  submitResult: (subject: Subject, difficulty: Difficulty) => Promise<void>;
}

const defaultSession: QuizSessionState = {
  quiz: null,
  currentIndex: 0,
  answers: [],
  checked: [],
  startTime: 0,
};

export const useQuizStore = create<QuizStore>((set, get) => ({
  session: defaultSession,
  isGenerating: false,
  error: null,

  generateQuiz: async ({ subject, topic, difficulty, questionCount = 10 }) => {
    set({ isGenerating: true, error: null });
    try {
      const { quiz } = await quizApi.generate({ subject, topic, difficulty, questionCount });
      set({
        session: {
          quiz,
          currentIndex: 0,
          answers: new Array(quiz.questions.length).fill(null),
          checked: new Array(quiz.questions.length).fill(false),
          startTime: Date.now(),
        },
        isGenerating: false,
      });
    } catch (e: any) {
      set({ error: e.message, isGenerating: false });
    }
  },

  answerQuestion: (index) => {
    const { session } = get();
    if (!session.quiz || session.checked[session.currentIndex]) return;
    const answers = [...session.answers];
    answers[session.currentIndex] = index;
    set({ session: { ...session, answers } });
  },

  checkAnswer: () => {
    const { session } = get();
    if (!session.quiz || session.answers[session.currentIndex] === null) return;
    const checked = [...session.checked];
    checked[session.currentIndex] = true;
    set({ session: { ...session, checked } });
  },

  nextQuestion: () => {
    const { session } = get();
    if (!session.quiz) return;
    const last = session.quiz.questions.length - 1;
    set({ session: { ...session, currentIndex: Math.min(session.currentIndex + 1, last) } });
  },

  prevQuestion: () => {
    const { session } = get();
    set({ session: { ...session, currentIndex: Math.max(session.currentIndex - 1, 0) } });
  },

  submitResult: async (subject, difficulty) => {
    const { session } = get();
    if (!session.quiz) return;
    const correct = session.answers.filter(
      (a, i) => a !== null && a === session.quiz!.questions[i].correctIndex
    ).length;
    const score = Math.round((correct / session.quiz.questions.length) * 100);
    const questions = session.quiz.questions.map((q) => q.question);
    try {
      await quizApi.submit({
        subject,
        difficulty,
        topic: session.quiz.title || "General practice",
        questions,
        score,
      });
    } catch {
      // A failed sync should not block the user finishing the quiz.
    }
  },

  resetSession: () => set({ session: defaultSession, error: null }),
}));
