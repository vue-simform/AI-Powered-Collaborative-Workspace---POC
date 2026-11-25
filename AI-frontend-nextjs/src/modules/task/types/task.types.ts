import type { User } from "@/modules/user/types/user.types";

// The four allowed states of a task (also the board columns).
// A task exactly as the API returns it. Dates arrive as ISO strings. `assignee` is the full user (or null).
export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
// How urgent a task is.
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  estimatedEffort: number;
  acceptanceCriteria: string[];
  subtasks: string[];
  technicalConsiderations: string[];
  assigneeId: string | null;
  assignee: User | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

// What Gemini suggests. The manager reviews and edits it before anything is saved.
export type GeneratedTask = {
  title: string;
  description: string;
  priority: Priority;
  estimatedEffort: number;
  acceptanceCriteria: string[];
  subtasks: string[];
  technicalConsiderations: string[];
};

// How much of a requirement is covered by the project documents.
// One requirement the AI extracted, with its documentation status and the places it came from.
export type RequirementStatus = "DOCUMENTED" | "PARTIALLY_DOCUMENTED" | "NOT_DOCUMENTED";
// Where in a document a requirement was found (page and section can be missing).
export type RequirementSource = { documentName: string; pageNumber: number | null; section: string | null };
export type Requirement = { text: string; status: RequirementStatus; sources: RequirementSource[] };

// NO_CONTEXT: nothing relevant was found in the project documents (or the project has none). The rest compare the task with what is documented.
export type ContextStatus = "NO_CONTEXT" | "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED";

// How well the project documents back the generated task. It is folded into the task's existing lists (see applyDocumentContext).
export type GenerationAnalysis = {
  requirements: Requirement[];
  suggestions: string[];
  contextStatus: ContextStatus;
  contextMessage: string;
};

// API answer for AI generation: either a ready task (plus analysis) or a question when the title is too vague.
export type GenerateTaskResult =
  | ({ status: "ok"; task: GeneratedTask } & GenerationAnalysis)
  | { status: "needs_clarification"; question: string };

// Data sent when creating a task: the AI-style fields plus the status and assignee the manager chose.
export type CreateTaskInput = GeneratedTask & { status: TaskStatus; assigneeId: string | null };

// State returned by the "generate with AI" form action.
export type GenerateState =
  | { status: "idle"; title: string }
  | { status: "error"; title: string; message: string }
  | { status: "clarify"; title: string; question: string }
  | { status: "ready"; title: string; task: GeneratedTask };

// State returned by the "create task" form action.
export type SubmitState = { error: string } | null;
