import { useProgressStore } from "../store/progressStore";

export const useStreak = () => {
  const { streakCalendar, progress } = useProgressStore();
  const streak = progress?.streak ?? 0;
  const activeDays = streakCalendar.filter((d) => d.active).length;

  return { streak, streakCalendar, activeDays };
};
