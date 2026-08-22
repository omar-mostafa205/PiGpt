import { create } from "zustand";
import type { GradeLevel } from "../types";
import type { Role, Goal, Source, OnboardingSubject } from "../types/user";
import { gradeLevelForRole, toApiSubject } from "../types/user";
import { storageGet, storageSet, STORAGE_KEYS } from "../utils/storage";

interface UserStore {
  role: Role | null;
  goal: Goal | null;
  subjects: OnboardingSubject[];
  source: Source | null;
  onboardingDone: boolean;

  /** Derived from `role` — what the solver sends as gradeLevel. */
  gradeLevel: GradeLevel | null;

  loadFromStorage: () => Promise<void>;
  setRole: (r: Role) => void;
  setGoal: (g: Goal) => void;
  toggleSubject: (s: OnboardingSubject) => void;
  setSource: (s: Source) => void;
  completeOnboarding: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  role: null,
  goal: null,
  subjects: [],
  source: null,
  onboardingDone: false,
  gradeLevel: null,

  loadFromStorage: async () => {
    const [done, role, goal, subjects, source] = await Promise.all([
      storageGet<boolean>(STORAGE_KEYS.ONBOARDING_DONE),
      storageGet<Role>(STORAGE_KEYS.ROLE),
      storageGet<Goal>(STORAGE_KEYS.GOAL),
      storageGet<OnboardingSubject[]>(STORAGE_KEYS.SUBJECTS),
      storageGet<Source>(STORAGE_KEYS.SOURCE),
    ]);
    set({
      onboardingDone: done ?? false,
      role: role ?? null,
      goal: goal ?? null,
      subjects: subjects ?? [],
      source: source ?? null,
      gradeLevel: role ? gradeLevelForRole(role) : null,
    });
  },

  setRole: (role) => {
    set({ role, gradeLevel: gradeLevelForRole(role) });
    storageSet(STORAGE_KEYS.ROLE, role);
  },

  setGoal: (goal) => {
    set({ goal });
    storageSet(STORAGE_KEYS.GOAL, goal);
  },

  toggleSubject: (s) => {
    const curr = get().subjects;
    const updated = curr.includes(s)
      ? curr.filter((x) => x !== s)
      : [...curr, s];
    set({ subjects: updated });
    storageSet(STORAGE_KEYS.SUBJECTS, updated);
  },

  setSource: (source) => {
    set({ source });
    storageSet(STORAGE_KEYS.SOURCE, source);
  },

  completeOnboarding: () => {
    set({ onboardingDone: true });
    storageSet(STORAGE_KEYS.ONBOARDING_DONE, true);
  },
}));

/** Subjects the solver can actually be switched to, de-duplicated. */
export const useApiSubjects = () => {
  const subjects = useUserStore((s) => s.subjects);
  const chosen = subjects.length
    ? subjects
    : (["Math", "Physics", "Chemistry", "Statistics", "Accounting"] as OnboardingSubject[]);
  return { labels: chosen, toApi: toApiSubject };
};
