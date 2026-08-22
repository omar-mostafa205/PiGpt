import { solveApi } from "../api/solve";
import { storageGet, storageSet, STORAGE_KEYS } from "../../utils/storage";
import { generateId } from "../../utils/helpers";
import type { ChatMessage, SolveRequest, Subject } from "../../types";

export const chatService = {
  /** Load cached history for a subject */
  loadHistory: async (subject: Subject): Promise<ChatMessage[]> => {
    return (
      (await storageGet<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY(subject))) ?? []
    );
  },

  /** Persist history */
  saveHistory: async (subject: Subject, messages: ChatMessage[]): Promise<void> => {
    await storageSet(STORAGE_KEYS.CHAT_HISTORY(subject), messages.slice(-50));
  },

  /** Send a message and return the assistant ChatMessage */
  sendMessage: async (payload: SolveRequest): Promise<ChatMessage> => {
    const response = await solveApi.solve(payload);
    return {
      id: generateId(),
      role: "assistant",
      content: response.raw,
      subject: payload.subject,
      timestamp: Date.now(),
      steps: response.steps,
      finalAnswer: response.finalAnswer,
      tip: response.tip,
      topic: response.topic,
      problemId: response.problemId,
    };
  },
};
