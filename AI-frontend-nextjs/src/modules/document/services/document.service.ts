import { api } from "@/lib/api";
import type { ProjectDocument } from "@/modules/document/types/document.types";

// GET: list the documents of a project.
export async function getDocuments(projectId: string) {
  return (await api.get<ProjectDocument[]>(`/projects/${projectId}/documents`)).data;
}

// Sent as multipart form data; the server checks type, size and content again.
export async function uploadDocuments(projectId: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  return (await api.post<ProjectDocument[]>(`/projects/${projectId}/documents`, form)).data;
}

// DELETE: remove one document (no response body needed).
export async function deleteDocument(projectId: string, documentId: string) {
  await api.delete(`/projects/${projectId}/documents/${documentId}`);
}

// POST: ask the backend to run processing again for a failed document.
export async function retryDocument(projectId: string, documentId: string) {
  return (await api.post<ProjectDocument>(`/projects/${projectId}/documents/${documentId}/retry`)).data;
}
