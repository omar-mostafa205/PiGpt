import { useCallback } from "react";
import { useRouter } from "expo-router";
import { progressApi } from "../services/api/progress";
import { useChatStore } from "../store/chatStore";
import { useSubjectStore } from "../store/subjectStore";
import { useUiStore } from "../store/uiStore";

/**
 * Opens a saved problem as a conversation: fetches the full answer, switches to
 * that subject's thread, closes any overlay and lands on the solver.
 */
export function useOpenSaved() {
  const router = useRouter();
  const openSaved = useChatStore((s) => s.openSaved);
  const setSubject = useSubjectStore((s) => s.setSubject);
  const closeOverlays = useUiStore((s) => s.closeOverlays);

  return useCallback(
    async (id: string) => {
      closeOverlays();
      router.push("/(tabs)");
      try {
        const { problem } = await progressApi.getProblem(id);
        setSubject(problem.subject);
        openSaved(problem);
      } catch {
        // Leaving the user on the solver with their current thread is a fine
        // outcome if the fetch fails.
      }
    },
    [closeOverlays, router, setSubject, openSaved]
  );
}
