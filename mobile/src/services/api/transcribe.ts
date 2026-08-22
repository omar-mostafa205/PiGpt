import { apiClient } from "./client";

export const transcribeApi = {
  fromAudio: async (params: { audioBase64: string; mimeType: string }): Promise<{ text: string }> => {
    const { data } = await apiClient.post("/api/transcribe", params, { timeout: 120_000 });
    return data;
  },
};
