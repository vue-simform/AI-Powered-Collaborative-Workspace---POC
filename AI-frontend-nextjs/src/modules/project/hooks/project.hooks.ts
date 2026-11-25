// 'use client': hooks only work in the browser (Client Components).
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as projectService from "@/modules/project/services/project.service";

// Cache keys: 'all' for the list, 'detail(id)' for a single project.
export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["project", id] as const,
};

// Fetches the project list. 'enabled' lets callers pause the request (e.g. until the user is logged in).
export function useProjects(enabled = true) {
  return useQuery({ queryKey: projectKeys.all, queryFn: projectService.getProjects, enabled });
}

// Fetches one project by id. retry:false so a bad id shows the error right away.
export function useProject(id: string) {
  return useQuery({ queryKey: projectKeys.detail(id), queryFn: () => projectService.getProject(id), retry: false });
}

// useMutation is for changes (create/update/delete). After success, invalidateQueries marks the project list as stale
// so it is re-fetched and the new project appears in the sidebar.
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
