import type { Task } from "@/modules/task/types/task.types";

// Same names as the backend (task.events.ts).
// Event names sent over the socket. `as const` keeps them as exact strings (not just `string`).
export const TASK_EVENTS = {
  created: "task:created",
  statusUpdated: "task:status-updated",
} as const;

// Typing for Socket.IO: maps each event name to the data the server sends with it, so listeners get typed `task`.
export interface ServerToClientEvents {
  [TASK_EVENTS.created]: (task: Task) => void;
  [TASK_EVENTS.statusUpdated]: (task: Task) => void;
}
