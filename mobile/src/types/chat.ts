export type Subject = "math" | "physics" | "chemistry" | "accounting";

export type GradeLevel =
  | "middle_school"
  | "high_school"
  | "ap_ib"
  | "university"
  | "self_study";

export type MessageRole = "user" | "assistant";

export interface SolutionStep {
  title: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  subject?: Subject;
  timestamp: number;
  imageBase64?: string;
  steps?: SolutionStep[];
  finalAnswer?: string;
  tip?: string;
  topic?: string;
  problemId?: string;
  isLoading?: boolean;
  error?: boolean;
}

export interface SolveRequest {
  question: string;
  subject: Subject;
  imageBase64?: string;
  gradeLevel?: GradeLevel;
  history?: { role: MessageRole; content: string }[];
}

export interface SolveResponse {
  problemId: string;
  steps: SolutionStep[];
  finalAnswer: string;
  tip?: string;
  topic?: string;
  raw: string;
}
