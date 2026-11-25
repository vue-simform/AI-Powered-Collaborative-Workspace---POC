// 'use client': hooks only work in the browser (Client Components).
"use client";

import { useQuery } from "@tanstack/react-query";
import * as userService from "@/modules/user/services/user.service";

// Query keys are the cache labels TanStack Query uses to store and refresh data.
export const userKeys = { all: ["users"] as const };

// People a task can be assigned to.
// useQuery fetches data and caches it under the key. retry:false = don't retry failed requests automatically.
export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: userService.getUsers, retry: false });
}
