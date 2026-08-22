import { apiClient } from "./client";
import type { LectureNote } from "../../types/voice";

export const notesApi = {
  list: async (): Promise<{ notes: LectureNote[] }> => {
    const { data } = await apiClient.get("/api/notes");
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/notes/${id}`);
  },
};
