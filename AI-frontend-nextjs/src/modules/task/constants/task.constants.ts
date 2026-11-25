import type { Priority, TaskStatus } from "@/modules/task/types/task.types";

// Select value meaning "no assignee" (an empty string cannot be a Select value).
export const UNASSIGNED = "unassigned";

// Status options: `value` is sent to the API, `label` is the friendly text shown to the user. Order = board columns.
export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
];

// Priority options (same idea: API value + display label).
export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

// Tailwind classes per status: `dot` is the small colored circle, `chip` is the colored pill with text.
export const STATUS_STYLES: Record<TaskStatus, { dot: string; chip: string }> = {
  TODO: { dot: "bg-slate-400", chip: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  COMPLETED: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  BLOCKED: { dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700" },
};

// Tailwind classes for the priority badge colors.
export const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-800",
};
