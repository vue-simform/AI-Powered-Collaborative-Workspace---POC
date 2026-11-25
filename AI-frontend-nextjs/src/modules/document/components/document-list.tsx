"use client";

import { useRef } from "react";
import { FileText, RefreshCw, Replace, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectDocument } from "@/modules/document/types/document.types";
import { formatFileSize, STATUS_LABELS, STATUS_STYLES } from "@/modules/document/utils/document.utils";

// Shows all uploaded documents, or a friendly empty message. Actions are handled by the parent via callbacks.
export function DocumentList({
  documents,
  busy,
  onRemove,
  onRetry,
  onReplace,
}: {
  documents: ProjectDocument[];
  busy: boolean;
  onRemove: (doc: ProjectDocument) => void;
  onRetry: (doc: ProjectDocument) => void;
  onReplace: (doc: ProjectDocument, file: File) => void;
}) {
  if (documents.length === 0) {
    return <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">No documents yet. Upload requirement documents to give the AI project context.</p>;
  }
  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <DocumentRow key={doc.id} doc={doc} busy={busy} onRemove={onRemove} onRetry={onRetry} onReplace={onReplace} />
      ))}
    </ul>
  );
}

// One document row: file info, status badge, and Retry / Replace / Remove buttons.
function DocumentRow({
  doc,
  busy,
  onRemove,
  onRetry,
  onReplace,
}: {
  doc: ProjectDocument;
  busy: boolean;
  onRemove: (doc: ProjectDocument) => void;
  onRetry: (doc: ProjectDocument) => void;
  onReplace: (doc: ProjectDocument, file: File) => void;
}) {
  // A ref points to the hidden file input, so the Replace icon button can open the file dialog with .click().
  const input = useRef<HTMLInputElement>(null);
  return (
    <li className="rounded-xl border bg-card p-3 text-sm">
      <div className="flex items-center gap-3">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{doc.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {doc.fileType.toUpperCase()} · {formatFileSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()}
            {doc.uploadedBy && ` · ${doc.uploadedBy.name}`}
          </p>
        </div>
        {/* Status badge. "..." is added while the document is still being processed. */}
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
          {STATUS_LABELS[doc.status]}
          {(doc.status === "PROCESSING" || doc.status === "UPLOADED") && "..."}
        </span>
        {/* Retry only makes sense for failed documents. */}
        {doc.status === "FAILED" && (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onRetry(doc)}>
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Replace ${doc.fileName}`} title="Replace" onClick={() => input.current?.click()}>
          <Replace className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`Remove ${doc.fileName}`} title="Remove" onClick={() => onRemove(doc)}>
          <Trash2 className="size-4" />
        </Button>
        {/* Hidden file picker for Replace. Clearing `value` afterwards lets the user pick the same file again. */}
        <input
          ref={input}
          type="file"
          hidden
          accept=".pdf,.docx"
          aria-label={`Choose a replacement for ${doc.fileName}`}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) onReplace(doc, file); e.target.value = ""; }}
        />
      </div>
      {/* Why the processing failed. */}
      {doc.status === "FAILED" && doc.errorMessage && <p role="alert" className="mt-2 text-xs text-destructive">{doc.errorMessage}</p>}
    </li>
  );
}
