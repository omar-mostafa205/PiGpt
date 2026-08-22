import { create } from "zustand";
import { progressApi } from "../services/api/progress";
import type { ProgressData, WeakTopic, RecentProblem, StreakDay } from "../types";

interface ProgressStore {
  progress: ProgressData | null;
  weakTopics: WeakTopic[];
  recentProblems: RecentProblem[];
  streakCalendar: StreakDay[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;

  fetchProgress: () => Promise<void>;
  fetchWeakTopics: () => Promise<void>;
  fetchRecentProblems: (reset?: boolean) => Promise<void>;
  fetchStreakCalendar: () => Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: null,
  weakTopics: [],
  recentProblems: [],
  streakCalendar: [],
  page: 1,
  hasMore: true,
  loading: false,
  error: null,

  fetchProgress: async () => {
    set({ loading: true, error: null });
    try {
      const data = await progressApi.getProgress();
      set({ progress: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchWeakTopics: async () => {
    try {
      const { weakTopics } = await progressApi.getWeakTopics();
      set({ weakTopics });
    } catch {}
  },

  fetchRecentProblems: async (reset = false) => {
    const { page, recentProblems } = get();
    const nextPage = reset ? 1 : page;
    try {
      const { problems, pagination } = await progressApi.getRecentProblems(nextPage);
      set({
        recentProblems: reset ? problems : [...recentProblems, ...problems],
        page: nextPage + 1,
        hasMore: nextPage < pagination.pages,
      });
    } catch {}
  },

  fetchStreakCalendar: async () => {
    try {
      const { calendar } = await progressApi.getStreakCalendar();
      set({ streakCalendar: calendar });
    } catch {}
  },
}));
