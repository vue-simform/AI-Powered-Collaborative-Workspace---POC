"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as taskService from "@/modules/task/services/task.service";
import type { CreateTaskInput, Task, TaskStatus } from "@/modules/task/types/task.types";

// Query keys are the "names" TanStack Query uses to store data in its cache.
// Keeping them in one place means every file refers to the same cache entry.
export const taskKeys = {
  byProject: (projectId: string) => ["tasks", projectId] as const,
};

// useQuery loads the task list and caches it. It stays disabled until we know the projectId.
export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.byProject(projectId ?? ""),
    queryFn: () => taskService.getProjectTasks(projectId!),
    // `enabled: false` makes the query wait (no request) until projectId exists.
    enabled: !!projectId,
    // Do not auto-retry on failure, so errors show up immediately.
    retry: false,
  });
}

// useMutation is for writing data (POST/PATCH/DELETE). Returns helpers like mutate/mutateAsync.
export function useCreateTask(projectId: string) {
  // The queryClient is the cache manager; we use it to mark data as stale after a change.
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.createTask(projectId, input),
    // After saving, invalidateQueries marks the task list as stale so it is refetched and the UI shows fresh data.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.byProject(projectId) }),
  });
}

// Mutation used when a task is moved to another status column.
export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      taskService.updateTaskStatus(task.id, status),
    // Refetch the list so the board matches the server after the status change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.byProject(projectId) }),
  });
}
