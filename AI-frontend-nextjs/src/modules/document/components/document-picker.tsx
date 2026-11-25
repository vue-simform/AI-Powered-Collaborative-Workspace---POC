"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_EXTENSIONS, checkFiles, formatFileSize, MAX_FILE_MB } from "@/modules/document/utils/document.utils";

// Drag-and-drop area plus a file list. The parent owns the chosen files and decides when to upload them.
export function DocumentPicker({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  // Ref to the hidden file input (opened by the Browse button).
  const input = useRef<HTMLInputElement>(null);
  // `dragging` highlights the drop zone while a file is dragged over it.
  const [dragging, setDragging] = useState(false);
  // Validation messages for files that were rejected.
  const [errors, setErrors] = useState<string[]>([]);

  // Validates newly chosen files, keeps the good ones, and tells the parent the new list.
  function add(list: FileList | null) {
    if (!list) return;
    const result = checkFiles(files, Array.from(list));
    setErrors(result.errors);
    onChange(result.files);
  }

  return (
    <div className="space-y-2">
      {/* Drop zone. Drag events: dragover fires while a file is above it (preventDefault is required to allow a drop),
          dragleave when it leaves, drop when released. */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) add(e.dataTransfer.files); }}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center text-sm transition-colors ${dragging ? "border-primary bg-accent" : "border-border"}`}
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <p>Drag PDF or DOCX files here, or</p>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
          Browse files
        </Button>
        <p className="text-xs text-muted-foreground">Up to {MAX_FILE_MB} MB each. Several files are allowed.</p>
        {/* Hidden native input; clicking Browse opens it. Resetting `value` allows choosing the same file twice. */}
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_EXTENSIONS.join(",")}
          aria-label="Choose documents"
          onChange={(e) => { add(e.target.files); e.target.value = ""; }}
        />
      </div>

      {errors.map((message) => <p key={message} role="alert" className="text-sm text-destructive">{message}</p>)}

      {/* List of selected files, each with a remove button. */}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
