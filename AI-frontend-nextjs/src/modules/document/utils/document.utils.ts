import type { DocumentStatus, ProjectDocument } from "@/modules/document/types/document.types";

// Upload limits (the server enforces them too).
export const MAX_FILE_MB = 10;
export const MAX_FILES = 10;
// Only these file types can be uploaded.
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

// Display text for each status.
export const STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: "Uploaded",
  PROCESSING: "Processing",
  PROCESSED: "Processed",
  FAILED: "Failed",
};

// Tailwind badge colors for each status.
export const STATUS_STYLES: Record<DocumentStatus, string> = {
  UPLOADED: "bg-slate-100 text-slate-700",
  PROCESSING: "bg-blue-100 text-blue-800",
  PROCESSED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

// True while the server is still working on the document (used to keep polling).
export const isProcessing = (doc: ProjectDocument) => doc.status === "UPLOADED" || doc.status === "PROCESSING";

// Converts bytes to a readable size: B, KB or MB.
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Quick checks before uploading. The server validates again, so this only saves a round trip.
export function checkFiles(current: File[], added: File[]) {
  const files = [...current];
  const errors: string[] = [];
  for (const file of added) {
    const supported = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!supported) errors.push(`"${file.name}" is not supported. Use PDF or DOCX files.`);
    else if (file.size === 0) errors.push(`"${file.name}" is empty.`);
    else if (file.size > MAX_FILE_MB * 1024 * 1024) errors.push(`"${file.name}" is larger than ${MAX_FILE_MB} MB.`);
    else if (files.some((f) => f.name === file.name && f.size === file.size)) errors.push(`"${file.name}" is already selected.`);
    else if (files.length >= MAX_FILES) errors.push(`You can upload at most ${MAX_FILES} files at once.`);
    else files.push(file);
  }
  return { files, errors };
}
