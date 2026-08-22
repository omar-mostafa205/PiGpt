import type { Subject, GradeLevel } from "./chat";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  gradeLevel?: GradeLevel;
  subjects: Subject[];
  createdAt: string;
}

// ── Onboarding (PiGPT design canvas) ────────────────────────────────────────
// The design asks four questions. `role` and `subjects` map onto types the API
// already understands; `goal` and `source` are product/analytics answers with
// no column in the Prisma schema, so they stay on the device for now.

export type Role =
  | "High school student"
  | "University student"
  | "Parent"
  | "Teacher"
  | "Self-study";

export type Goal =
  | "Getting homework help"
  | "Acing my exams"
  | "Understanding the why"
  | "Catching up fast";

export type Source =
  | "A friend or classmate"
  | "Social media"
  | "App Store"
  | "Teacher or school"
  | "Somewhere else";

/**
 * The design offers Statistics, which the backend `Subject` enum does not have.
 * It is kept here so onboarding matches the design, and mapped to `math` on the
 * way to the API (see `toApiSubject`) until the enum gains a statistics value.
 */
export type OnboardingSubject =
  | "Math"
  | "Physics"
  | "Chemistry"
  | "Statistics"
  | "Accounting";

const SUBJECT_TO_API: Record<OnboardingSubject, Subject> = {
  Math: "math",
  Physics: "physics",
  Chemistry: "chemistry",
  Statistics: "math",
  Accounting: "accounting",
};

export const toApiSubject = (s: OnboardingSubject): Subject => SUBJECT_TO_API[s];

/**
 * The solver calibrates its explanations by grade level, so a role has to
 * resolve to one. Parent and Teacher are asking on someone else's behalf, and
 * high school is the most common case there.
 */
const ROLE_TO_GRADE: Record<Role, GradeLevel> = {
  "High school student": "high_school",
  "University student": "university",
  Parent: "high_school",
  Teacher: "high_school",
  "Self-study": "self_study",
};

export const gradeLevelForRole = (role: Role): GradeLevel => ROLE_TO_GRADE[role];
