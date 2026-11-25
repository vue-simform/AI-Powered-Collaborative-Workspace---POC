"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as documentService from "@/modules/document/services/document.service";
import { isProcessing } from "@/modules/document/utils/document.utils";

// Cache key for a project's document list in TanStack Query.
export const documentKeys = {
  byProject: (projectId: string) => ["documents", projectId] as const,
};

// Checks again every 2 seconds while any document is still being processed, so the status badge updates by itself.
export function useDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: documentKeys.byProject(projectId ?? ""),
    queryFn: () => documentService.getDocuments(projectId!),
    enabled: !!projectId,
    retry: false,
    // refetchInterval = polling. Returning 2000 repeats the request every 2s; returning false stops it.
    refetchInterval: (query) => (query.state.data?.some(isProcessing) ? 2000 : false),
  });
}

// Mutation: upload files, then invalidateQueries refetches the list so the new documents appear.
export function useUploadDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, files }: { projectId: string; files: File[] }) => documentService.uploadDocuments(projectId, files),
    onSuccess: (_docs, { projectId }) => queryClient.invalidateQueries({ queryKey: documentKeys.byProject(projectId) }),
  });
}

// Mutation: delete a document, then refresh the list.
export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentService.deleteDocument(projectId, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.byProject(projectId) }),
  });
}

// Mutation: ask the server to process a failed document again, then refresh the list.
export function useRetryDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentService.retryDocument(projectId, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.byProject(projectId) }),
  });
}
