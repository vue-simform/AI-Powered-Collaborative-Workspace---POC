import { PRIORITIES, STATUSES, UNASSIGNED } from "@/modules/task/constants/task.constants";
import type { CreateTaskInput, GeneratedTask, GenerationAnalysis, Priority, RequirementSource, Task, TaskStatus } from "@/modules/task/types/task.types";

// Turn an API value ("IN_PROGRESS") into display text ("In Progress"). Falls back to the raw value.
export const statusLabel = (s: TaskStatus) => STATUSES.find((x) => x.value === s)?.label ?? s;
export const priorityLabel = (p: Priority) => PRIORITIES.find((x) => x.value === p)?.label ?? p;

// Dashboard numbers are derived from the task list, so they always match the board.
export function taskStats(tasks: Task[]) {
  const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  const total = tasks.length;
  const completed = count("COMPLETED");
  return {
    total,
    todo: count("TODO"),
    inProgress: count("IN_PROGRESS"),
    completed,
    blocked: count("BLOCKED"),
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

// Turns the submitted form into a task. List items are separate inputs with the same name.
export function readTaskInput(formData: FormData): CreateTaskInput {
  const assignee = String(formData.get("assigneeId") ?? "");
  const list = (name: string) => formData.getAll(name).map((v) => String(v).trim()).filter(Boolean);
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    priority: String(formData.get("priority") ?? "MEDIUM") as Priority,
    estimatedEffort: Number(formData.get("estimatedEffort")),
    status: String(formData.get("status") ?? "TODO") as TaskStatus,
    assigneeId: assignee && assignee !== UNASSIGNED ? assignee : null,
    acceptanceCriteria: list("acceptanceCriteria"),
    subtasks: list("subtasks"),
    technicalConsiderations: list("technicalConsiderations"),
  };
}

// Limits used when writing AI notes into a list (the API rejects longer lists).
const MAX_LIST_ITEMS = 15; // the API accepts at most 15 items per list
const MAX_ITEM_LENGTH = 300;
// Shortens long text to MAX_ITEM_LENGTH and adds an ellipsis.
const cut = (text: string) => (text.length > MAX_ITEM_LENGTH ? `${text.slice(0, MAX_ITEM_LENGTH - 1)}…` : text);

// Builds a short reference like "spec.pdf p.3 § Login" from the pieces that exist.
const sourceText = (s: RequirementSource) =>
  [s.documentName, s.pageNumber ? `p.${s.pageNumber}` : null, s.section ? `§ ${s.section}` : null].filter(Boolean).join(" ");

// Writes what the document check found into the task's existing "Technical considerations" list, so the manager
// sees it (and can edit it) in the normal form: where it came from, what is only partly documented, what is not
// documented at all, and the AI's own suggestions. Nothing else in the form changes.
export function applyDocumentContext(task: GeneratedTask, analysis: GenerationAnalysis): GeneratedTask {
  const { requirements, suggestions, contextStatus, contextMessage } = analysis;
  const notes: string[] = [];

  // The server's summary of how well the documents cover the task (a warning when nothing relevant was found).
  if (contextStatus === "NO_CONTEXT" || contextStatus === "NOT_SUPPORTED" || contextStatus === "PARTIALLY_SUPPORTED") notes.push(contextMessage);

  const sources = [...new Set(requirements.flatMap((r) => r.sources.map(sourceText)))];
  if (sources.length) notes.push(`Based on project documents: ${sources.join(", ")}`);

  for (const r of requirements) {
    if (r.status === "PARTIALLY_DOCUMENTED") notes.push(`Partially documented (details missing): ${r.text}`);
    if (r.status === "NOT_DOCUMENTED") notes.push(`Not in project documents: ${r.text}`);
  }
  for (const s of suggestions) notes.push(`AI suggestion (not a project requirement): ${s}`);

  const extra = notes.slice(0, MAX_LIST_ITEMS).map(cut);
  const room = MAX_LIST_ITEMS - extra.length;
  return { ...task, technicalConsiderations: [...task.technicalConsiderations.slice(0, room), ...extra] };
}
