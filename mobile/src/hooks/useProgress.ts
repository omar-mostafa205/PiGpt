import { useEffect } from "react";
import { useProgressStore } from "../store/progressStore";

export const useProgress = () => {
  const store = useProgressStore();

  useEffect(() => {
    store.fetchProgress();
    store.fetchWeakTopics();
    store.fetchRecentProblems(true);
    store.fetchStreakCalendar();
  }, []);

  return store;
};
