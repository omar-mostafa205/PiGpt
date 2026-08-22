import { apiClient } from "./client";
import type { SolveRequest, SolveResponse } from "../../types";

export const solveApi = {
  solve: async (payload: SolveRequest): Promise<SolveResponse> => {
    const { data } = await apiClient.post<SolveResponse>("/api/solve", payload);
    return data;
  },

  uploadPdf: async (fileBuffer: FormData): Promise<{ extractedText: string }> => {
    const { data } = await apiClient.post("/api/upload", fileBuffer, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
