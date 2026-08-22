import { create } from "zustand";
import type { Subject } from "../types";
import { toApiSubject, type OnboardingSubject } from "../types/user";

/**
 * Two identities for the same choice:
 *  - `activeLabel` is what the user picked and what the UI highlights
 *  - `activeSubject` is the enum the API accepts
 *
 * They are separate because Statistics has no backend enum value and maps onto
 * `math`. Keying the selected state off `activeSubject` alone made Math and
 * Statistics both appear active at once.
 */
interface SubjectStore {
  activeSubject: Subject;
  activeLabel: OnboardingSubject;
  setSubject: (s: Subject) => void;
  setSubjectByLabel: (label: OnboardingSubject) => void;
}

const LABEL_FOR: Record<Subject, OnboardingSubject> = {
  math: "Math",
  physics: "Physics",
  chemistry: "Chemistry",
  accounting: "Accounting",
};

export const useSubjectStore = create<SubjectStore>((set) => ({
  activeSubject: "math",
  activeLabel: "Math",
  setSubject: (s) => set({ activeSubject: s, activeLabel: LABEL_FOR[s] }),
  setSubjectByLabel: (label) => set({ activeLabel: label, activeSubject: toApiSubject(label) }),
}));
