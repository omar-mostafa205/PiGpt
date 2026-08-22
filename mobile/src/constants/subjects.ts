import type { Subject } from "../types";
import { Colors } from "./colors";

export interface SubjectConfig {
  id: Subject;
  label: string;
  shortLabel: string;
  color: string;
  lightColor: string;
  emoji: string;
  systemPromptHint: string;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id: "math",
    label: "MathGPT",
    shortLabel: "Math",
    color: Colors.math,
    lightColor: Colors.mathLight,
    emoji: "📐",
    systemPromptHint: "expert math tutor who explains every step clearly",
  },
  {
    id: "physics",
    label: "PhysicsGPT",
    shortLabel: "Physics",
    color: Colors.physics,
    lightColor: Colors.physicsLight,
    emoji: "⚡",
    systemPromptHint: "expert physics professor who connects equations to real-world intuition",
  },
  {
    id: "chemistry",
    label: "ChemGPT",
    shortLabel: "Chem",
    color: Colors.chemistry,
    lightColor: Colors.chemistryLight,
    emoji: "⚗️",
    systemPromptHint: "expert chemistry teacher who explains molecular intuition behind reactions",
  },
  {
    id: "accounting",
    label: "AccountingGPT",
    shortLabel: "Accounting",
    color: Colors.accounting,
    lightColor: Colors.accountingLight,
    emoji: "📊",
    systemPromptHint: "expert accounting tutor who explains debits, credits, and financial statements clearly",
  },
];

export const getSubjectConfig = (subject: Subject): SubjectConfig =>
  SUBJECTS.find((s) => s.id === subject) ?? SUBJECTS[0];
