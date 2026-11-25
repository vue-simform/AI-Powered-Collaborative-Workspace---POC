// 'use client': uses state and event handlers, so it runs in the browser.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/api";
import { DocumentPicker } from "@/modules/document/components/document-picker";
import { useUploadDocuments } from "@/modules/document/hooks/document.hooks";
import { useCreateProject } from "@/modules/project/hooks/project.hooks";

// Side panel with a form to create a project and optionally upload requirement documents.
// open/onOpenChange are controlled by the parent; onCreated tells the parent the new project id.
export function CreateProjectSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (projectId: string) => void;
}) {
  // Two mutations: one creates the project, the other uploads its documents.
  const createProject = useCreateProject();
  const uploadDocuments = useUploadDocuments();
  // Form field values and error text, kept in state.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // Set when the project exists but its documents did not upload, so the user can still continue.
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Reset the form, close the panel, and tell the parent to open the project.
  function finish(projectId: string) {
    setName("");
    setDescription("");
    setFiles([]);
    setCreatedId(null);
    onOpenChange(false);
    onCreated(projectId);
  }

  // Submit flow: validate name -> create project -> upload files (if any) -> finish.
  // If only the upload fails, the project still exists, so we let the user continue.
  async function onSubmit(e: React.FormEvent) {
    // Stop the browser's default full-page form submit.
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Project name is required");
    let project;
    try {
      project = await createProject.mutateAsync({ name: name.trim(), description: description.trim() });
    } catch (err) {
      return setError(errorMessage(err, "Could not create project"));
    }
    if (files.length === 0) return finish(project.id);
    try {
      await uploadDocuments.mutateAsync({ projectId: project.id, files });
      finish(project.id);
    } catch (err) {
      setCreatedId(project.id);
      setError(`${errorMessage(err, "Could not upload the documents")}. The project was created; you can add documents from its Documents tab.`);
    }
  }

  // True while either request is in flight; used to disable inputs and the button.
  const busy = createProject.isPending || uploadDocuments.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New project</SheetTitle>
          <SheetDescription>Create a project to organise your tasks.</SheetDescription>
        </SheetHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Project documents (optional)</Label>
            <p className="text-xs text-muted-foreground">Requirement documents help the AI check generated tasks against what is documented.</p>
            <DocumentPicker files={files} onChange={setFiles} disabled={busy || !!createdId} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {createdId ? (
            <Button type="button" className="w-full" onClick={() => finish(createdId)}>Go to project</Button>
          ) : (
            <Button type="submit" className="w-full" disabled={busy}>
              {createProject.isPending ? "Creating..." : uploadDocuments.isPending ? "Uploading documents..." : "Create project"}
            </Button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
