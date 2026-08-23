import { create } from "zustand";
import type { ChatMessage, Subject } from "../types";
import { chatService } from "../services/features/chatService";
import { streamSolve } from "../services/api/stream";
import { generateId } from "../utils/helpers";

interface ChatStore {
  messages: Record<Subject, ChatMessage[]>;
  isLoading: boolean;
  error: string | null;

  loadHistory: (subject: Subject) => Promise<void>;
  sendMessage: (params: {
    question: string;
    subject: Subject;
    imageBase64?: string;
    gradeLevel?: string;
  }) => Promise<void>;
  /** Replace a subject's thread with a saved question and its answer. */
  openSaved: (problem: {
    id: string;
    subject: Subject;
    question: string;
    answer: string;
    topic: string | null;
    createdAt: string;
  }) => void;
  clearChat: (subject: Subject) => void;
  /** Drop every thread from memory, e.g. when the account changes. */
  resetAll: () => void;
  /** Abort the in-flight answer; whatever streamed so far is kept. */
  stopStreaming: () => void;
  setError: (err: string | null) => void;
}

/** Controller for the answer currently streaming, if any. */
let inFlight: AbortController | null = null;

const emptyMessages: Record<Subject, ChatMessage[]> = {
  math: [],
  physics: [],
  chemistry: [],
  accounting: [],
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: emptyMessages,
  isLoading: false,
  error: null,

  loadHistory: async (subject) => {
    const cached = await chatService.loadHistory(subject);
    set((state) => ({ messages: { ...state.messages, [subject]: cached } }));
  },

  sendMessage: async ({ question, subject, imageBase64, gradeLevel }) => {
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: question,
      subject,
      timestamp: Date.now(),
      imageBase64,
    };

    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      subject,
      timestamp: Date.now(),
      isLoading: true,
    };

    const history = get()
      .messages[subject].filter((m) => !m.isLoading)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    set((state) => ({
      messages: { ...state.messages, [subject]: [...state.messages[subject], userMsg, assistantMsg] },
      isLoading: true,
      error: null,
    }));

    /** Patch the in-flight assistant message without touching the rest. */
    const patch = (fields: Partial<ChatMessage>) =>
      set((state) => ({
        messages: {
          ...state.messages,
          [subject]: state.messages[subject].map((m) =>
            m.id === assistantId ? { ...m, ...fields } : m
          ),
        },
      }));

    // `streamed` is the network truth; `displayed` is what the UI has revealed.
    // Revealing on a timer, scaled to the backlog, gives an even typewriter
    // cadence instead of the lumpy bursts the network actually delivers.
    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;

    let streamed = "";
    let displayed = 0;
    let finished = false;

    const timer = setInterval(() => {
      if (displayed >= streamed.length) {
        if (finished) clearInterval(timer);
        return;
      }
      const backlog = streamed.length - displayed;
      displayed = Math.min(streamed.length, displayed + Math.max(2, Math.ceil(backlog / 15)));
      patch({ content: streamed.slice(0, displayed), isLoading: false });
    }, 16);

    try {
      for await (const event of streamSolve(
        { question, subject, imageBase64, gradeLevel: gradeLevel as never, history },
        controller.signal
      )) {
        if (event.type === "problem") {
          patch({ problemId: event.problemId });
        } else if (event.type === "text") {
          streamed += event.value;
        } else if (event.type === "done") {
          patch({ topic: event.topic });
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      finished = true;
      // Flush anything the timer has not revealed yet.
      displayed = streamed.length;
      patch({ content: streamed, isLoading: false });

      const updated = get().messages[subject];
      chatService.saveHistory(subject, updated);
      set({ isLoading: false });
    } catch (err: any) {
      finished = true;
      clearInterval(timer);

      // A user-initiated stop keeps the partial answer and is not an error.
      const aborted = controller.signal.aborted || err?.name === "AbortError";
      patch({
        content: streamed || (aborted ? "" : err.message || "Failed to get a response."),
        isLoading: false,
        error: !aborted && !streamed,
      });
      set({ isLoading: false, error: aborted ? null : err.message });
      chatService.saveHistory(subject, get().messages[subject]);
    } finally {
      finished = true;
      if (inFlight === controller) inFlight = null;
    }
  },

  stopStreaming: () => {
    inFlight?.abort();
    inFlight = null;
    set({ isLoading: false });
  },

  openSaved: (problem) => {
    const at = new Date(problem.createdAt).getTime();
    const thread: ChatMessage[] = [
      {
        id: `${problem.id}-q`,
        role: "user",
        content: problem.question,
        subject: problem.subject,
        timestamp: at,
      },
      {
        id: `${problem.id}-a`,
        role: "assistant",
        content: problem.answer,
        subject: problem.subject,
        timestamp: at + 1,
        topic: problem.topic ?? undefined,
        problemId: problem.id,
      },
    ];
    set((state) => ({
      messages: { ...state.messages, [problem.subject]: thread },
      isLoading: false,
      error: null,
    }));
    chatService.saveHistory(problem.subject, thread);
  },

  clearChat: (subject) => {
    set((state) => ({ messages: { ...state.messages, [subject]: [] } }));
    chatService.saveHistory(subject, []);
  },

  resetAll: () => {
    inFlight?.abort();
    inFlight = null;
    set({ messages: emptyMessages, isLoading: false, error: null });
  },

  setError: (err) => set({ error: err }),
}));
