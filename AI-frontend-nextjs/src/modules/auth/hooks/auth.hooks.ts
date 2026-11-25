// 'use client': hooks only work in the browser (Client Components).
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as authService from "@/modules/auth/services/auth.service";

// Cache key under which the current user is stored.
export const authKeys = { me: ["me"] as const };

// The HTTP-only cookie is the session; /auth/me tells us who it belongs to (401 = signed out).
// Reads the current user. If the request fails (not logged in) we return null instead of an error.
// staleTime: Infinity = never auto-refetch; we update the cache manually on login/logout.
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await authService.getMe();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });
}

// Logs in, then fetches the user and puts it straight into the cache (setQueryData) so the UI updates immediately.
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof authService.login>[0]) => {
      await authService.login(input);
      return authService.getMe();
    },
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  });
}

// Creates an account.
export function useRegister() {
  return useMutation({ mutationFn: authService.register });
}

// Logs out. onSettled runs on success OR failure: clear the cached user and go to /login either way.
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      queryClient.setQueryData(authKeys.me, null);
      router.replace("/login");
    },
  });
}

// Session state plus the auth actions, for components that need more than one of them.
// The wrappers use mutateAsync so callers can await them and catch errors with try/catch.
export function useAuth() {
  const { data: user = null, isLoading } = useMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user,
    isLoading,
    login: async (input: Parameters<typeof authService.login>[0]) => void (await loginMutation.mutateAsync(input)),
    register: async (input: Parameters<typeof authService.register>[0]) => void (await registerMutation.mutateAsync(input)),
    logout: async () => void (await logoutMutation.mutateAsync().catch(() => undefined)),
  };
}
