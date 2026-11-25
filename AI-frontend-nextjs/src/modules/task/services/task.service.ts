import { api } from "@/lib/api";
import type { CreateTaskInput, GenerateTaskResult, Task, TaskStatus } from "@/modules/task/types/task.types";

// GET: fetch every task of one project. `api` is our axios instance; `.data` is the response body.
export async function getProjectTasks(projectId: string) {
  return (await api.get<Task[]>(`/projects/${projectId}/tasks`)).data;
}

// POST: save a new task under a project and return the saved task from the server.
export async function createTask(projectId: string, input: CreateTaskInput) {
  return (await api.post<Task>(`/projects/${projectId}/tasks`, input)).data;
}

// PATCH: change only the status of a task (e.g. TODO -> IN_PROGRESS).
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  return (await api.patch<Task>(`/tasks/${taskId}/status`, { status })).data;
}

// Asks the backend (Gemini) for suggestions, checked against the project's documents. Nothing is saved until the manager approves.
export async function generateTask(projectId: string, title: string) {
  return (await api.post<GenerateTaskResult>("/ai/generate-task", { projectId, title })).data;
}
