import { apiClient } from "./client";
import type {
  SavedProblem,
  ProgressData,
  WeakTopic,
  PaginatedProblems,
  StreakDay,
} from "../../types";

export const progressApi = {
  getProgress: async (): Promise<ProgressData> => {
    const { data } = await apiClient.get<ProgressData>("/api/progress");
    return data;
  },

  getRecentProblems: async (page = 1): Promise<PaginatedProblems> => {
    const { data } = await apiClient.get<PaginatedProblems>(
      `/api/progress/recent?page=${page}`
    );
    return data;
  },

  getProblem: async (id: string): Promise<{ problem: SavedProblem }> => {
    const { data } = await apiClient.get(`/api/progress/problem/${id}`);
    return data;
  },

  getWeakTopics: async (): Promise<{ weakTopics: WeakTopic[] }> => {
    const { data } = await apiClient.get("/api/progress/weak-topics");
    return data;
  },

  getStreakCalendar: async (): Promise<{ calendar: StreakDay[] }> => {
    const { data } = await apiClient.get("/api/progress/streak");
    return data;
  },
};
