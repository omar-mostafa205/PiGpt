import { create } from "zustand";
import { progressApi } from "../services/api/progress";
import { quizApi } from "../services/api/quiz";
import { notesApi } from "../services/api/notes";
import type { RecentProblem, QuizHistoryItem } from "../types";
import type { LectureNote } from "../types/voice";

/**
 * Backs the sidebar's Pinned and Recents sections. These used to be hardcoded
 * arrays; both now come from Postgres.
 */
interface LibraryStore {
  recents: RecentProblem[];
  quizzes: QuizHistoryItem[];
  notes: LectureNote[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  recents: [],
  quizzes: [],
  notes: [],
  loading: false,
  loaded: false,

  reset: () => set({ recents: [], quizzes: [], notes: [], loaded: false }),

  refresh: async () => {
    set({ loading: true });
    const [problems, quizzes, notes] = await Promise.allSettled([
      progressApi.getRecentProblems(1),
      quizApi.getHistory(),
      notesApi.list(),
    ]);
    set({
      recents: problems.status === "fulfilled" ? problems.value.problems : [],
      quizzes: quizzes.status === "fulfilled" ? quizzes.value.quizzes : [],
      notes: notes.status === "fulfilled" ? notes.value.notes : [],
      loading: false,
      loaded: true,
    });
  },
}));
