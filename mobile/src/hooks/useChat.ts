import { useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { useSubjectStore } from "../store/subjectStore";
import { useUserStore } from "../store/userStore";

export const useChat = () => {
  const subject = useSubjectStore((s) => s.activeSubject);
  const { messages, isLoading, error, loadHistory, sendMessage, clearChat, stopStreaming } =
    useChatStore();
  const gradeLevel = useUserStore((s) => s.gradeLevel);

  useEffect(() => {
    loadHistory(subject);
  }, [subject]);

  const send = (question: string, imageBase64?: string) =>
    sendMessage({ question, subject, imageBase64, gradeLevel: gradeLevel ?? undefined });

  return {
    messages: messages[subject] ?? [],
    isLoading,
    error,
    send,
    stop: stopStreaming,
    clearChat: () => clearChat(subject),
  };
};
