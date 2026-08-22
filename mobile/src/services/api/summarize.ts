import { apiClient } from "./client";
import type { Subject } from "../../types";
import type { LectureSummary } from "../../types/voice";

export const summarizeApi = {
  fromAudio: async (params: {
    audioBase64: string;
    mimeType: string;
    subject?: Subject;
    durationMs?: number;
  }): Promise<{ summary: LectureSummary; noteId: string }> => {
    const { data } = await apiClient.post("/api/summarize", params, {
      // Transcription of a long recording takes noticeably longer than a solve.
      timeout: 180_000,
    });
    return data;
  },
};
