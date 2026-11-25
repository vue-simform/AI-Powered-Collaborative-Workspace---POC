"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { useDeleteDocument, useDocuments, useRetryDocument, useUploadDocuments } from "@/modules/document/hooks/document.hooks";
import type { ProjectDocument } from "@/modules/document/types/document.types";
import { checkFiles } from "@/modules/document/utils/document.utils";
import { DocumentList } from "./document-list";
import { DocumentPicker } from "./document-picker";

// The "Documents" tab of a project: what the AI knowledge base is built from.
// Container for the Documents tab. It owns the data hooks and passes data and actions to the child components.
export function ProjectDocuments({ projectId }: { projectId: string }) {
  // useQuery: loads the documents list (and polls while any are processing).
  const documents = useDocuments(projectId);
  // Mutations (write actions). Each has isPending, so we can disable buttons while one is running.
  const upload = useUploadDocuments();
  const remove = useDeleteDocument(projectId);
  const retry = useRetryDocument(projectId);
  // Files the user picked but has not uploaded yet.
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  // True while any action is running; used to disable the buttons.
  const busy = upload.isPending || remove.isPending || retry.isPending;
  // Shows an error message, using a fallback text if the error has none.
  const fail = (err: unknown, fallback: string) => setError(errorMessage(err, fallback));

  // Upload the picked files. On success clear the selection; on error show the message.
  function uploadSelected() {
    setError("");
    upload.mutate({ projectId, files }, { onSuccess: () => setFiles([]), onError: (err) => fail(err, "Could not upload the documents") });
  }

  // Replace = upload the new file, then remove the old one (so the old one stays if the upload fails).
  // Replace = upload the new file, then remove the old one (so the old one stays if the upload fails).
  function replace(doc: ProjectDocument, file: File) {
    setError("");
    const { files: checked, errors } = checkFiles([], [file]);
    if (errors.length) return setError(errors[0]);
    upload.mutate(
      { projectId, files: checked },
      { onSuccess: () => remove.mutate(doc.id, { onError: (err) => fail(err, "Uploaded, but the old document could not be removed") }), onError: (err) => fail(err, "Could not replace the document") },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Documents are split into sections and indexed so the AI can check generated tasks against your requirements. Only this project&apos;s documents are used here.
      </p>

      <div className="space-y-3 rounded-xl border bg-muted/50 p-4">
        {/* Pick files (drag and drop or browse). */}
        <DocumentPicker files={files} onChange={setFiles} disabled={busy} />
        {files.length > 0 && (
          <Button type="button" disabled={busy} onClick={uploadSelected}>
            {upload.isPending ? "Uploading..." : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
          </Button>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {/* Loading, error and success states of the query. */}
      {documents.isLoading && <Skeleton className="h-20 w-full" />}
      {documents.isError && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">{errorMessage(documents.error, "Could not load documents")}</p>
          <Button variant="outline" size="sm" onClick={() => documents.refetch()}>Retry</Button>
        </div>
      )}
      {documents.data && (
        <DocumentList
          documents={documents.data}
          busy={busy}
          onRemove={(doc) => { setError(""); remove.mutate(doc.id, { onError: (err) => fail(err, "Could not remove the document") }); }}
          onRetry={(doc) => { setError(""); retry.mutate(doc.id, { onError: (err) => fail(err, "Could not retry the document") }); }}
          onReplace={replace}
        />
      )}
    </div>
  );
}
