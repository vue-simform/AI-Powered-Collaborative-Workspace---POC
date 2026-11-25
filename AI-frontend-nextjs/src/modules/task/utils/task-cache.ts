import type { Task } from "@/modules/task/types/task.types";

// Pure helpers for the cached task list. An undefined list (project never loaded) stays undefined,
// so a socket event never creates a cache entry that has not been fetched.

// Adds the task, or replaces it if it is already there (the creator also receives its own event).
export function addTask(list: Task[] | undefined, task: Task) {
  if (!list) return list;
  return list.some((t) => t.id === task.id) ? list.map((t) => (t.id === task.id ? task : t)) : [...list, task];
}

// Swaps in the updated version of a task (used when a status changes). Does nothing if the task is not in the list.
export function replaceTask(list: Task[] | undefined, task: Task) {
  if (!list || !list.some((t) => t.id === task.id)) return list;
  return list.map((t) => (t.id === task.id ? task : t));
}
