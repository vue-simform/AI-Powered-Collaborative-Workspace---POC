"use client";

import { useActionState, ViewTransition } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/api";
import { useCreateTask } from "@/modules/task/hooks/task.hooks";
import { useUsers } from "@/modules/user/hooks/user.hooks";
import { generateTask } from "@/modules/task/services/task.service";
import type { GenerateState, SubmitState, Task } from "@/modules/task/types/task.types";
import { applyDocumentContext, readTaskInput } from "@/modules/task/utils/task.utils";
import { TaskFormFields } from "./task-form-fields";

// useFormStatus must be called from a component rendered inside the <form>, so the button is its own component.
// Submit button that disables itself and changes its text while the parent <form> action is running.
function SubmitButton({ label, pendingLabel, icon }: { label: string; pendingLabel: string; icon?: React.ReactNode }) {
  // `pending` is true from the moment the form is submitted until its action finishes.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="flex-1" disabled={pending}>
      {!pending && icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}

// Callbacks come from the board: close the sheet, add a temporary card, and report success or failure.
type Props = {
  projectId: string;
  onClose: () => void;
  onOptimisticAdd: (task: Task) => void;
  onCreated: (title: string) => void;
  onError: (message: string) => void;
};

// Two-step flow inside the sheet: (1) type a title and let AI suggest details, (2) review/edit and save.
export function CreateTaskFlow({ projectId, onClose, onOptimisticAdd, onCreated, onError }: Props) {
  // useMutation wrapper that saves the task and refreshes the list.
  const createTask = useCreateTask(projectId);
  // All users, needed to fill the assignee dropdown and to show the assignee on the temporary card.
  const { data: users = [] } = useUsers();

  // Action 1: ask Gemini (through the NestJS API) for suggestions. Does not save anything.
  // useActionState(action, initialState) runs an async function when the form is submitted and keeps its
  // return value as `state`. It returns [state, formAction]; formAction is passed to <form action={...}>.
  const [generateState, generateAction] = useActionState(
    async (_prev: GenerateState, formData: FormData): Promise<GenerateState> => {
      const title = String(formData.get("title") ?? "").trim();
      // Validate first so we do not call the AI with an empty or tiny title.
      if (title.length < 3) return { status: "error", title, message: "Enter a task title (at least 3 characters)" };
      try {
        const result = await generateTask(projectId, title);
        // The AI may ask a question when the title is too vague; show it instead of a task.
        if (result.status === "needs_clarification") return { status: "clarify", title, question: result.question };
        // Merge what the project documents say into the task so the manager can see and edit it.
        return { status: "ready", title, task: applyDocumentContext(result.task, result) };
      } catch (err) {
        return { status: "error", title, message: errorMessage(err, "Could not generate task details") };
      }
    },
    { status: "idle", title: "" } as GenerateState,
  );

  // Action 2: save the task the manager approved. The board shows it immediately (useOptimistic).
  // Same pattern for step 2. The state is either an error message or null (= no error).
  const [submitState, submitAction] = useActionState(
    async (_prev: SubmitState, formData: FormData): Promise<SubmitState> => {
      const input = readTaskInput(formData);
      if (!input.title) return { error: "Title is required" };
      if (!Number.isInteger(input.estimatedEffort) || input.estimatedEffort < 1 || input.estimatedEffort > 1000) {
        return { error: "Estimated effort must be a whole number of hours (1-1000)" };
      }

      // useOptimistic (in the board): show the new card right away with a fake id, before the server answers.
      // If the save fails, React removes the fake card automatically.
      onOptimisticAdd({
        ...input,
        assignee: users.find((u) => u.id === input.assigneeId) ?? null,
        id: `optimistic-${Date.now()}`,
        projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Close the sheet immediately; the user sees the "Saving..." card on the board.
      onClose();

      try {
        // mutateAsync returns a promise, so the action stays "pending" until the save and refetch finish.
        await createTask.mutateAsync(input); // refetches the task list before resolving
        onCreated(input.title);
        return null;
      } catch (err) {
        const message = errorMessage(err, "Could not create task");
        onError(message);
        return { error: message };
      }
    },
    null,
  );

  // Once Gemini answers, show its suggestions in an editable form. Nothing is saved until "Create task".
  // Step 2: AI answered, show the editable preview form.
  if (generateState.status === "ready") {
    // ViewTransition animates the swap between the title form and the preview (the `key` tells React they are different screens).
    return (
      <ViewTransition key="preview">
        {/* Passing a function to `action` lets React handle submit and gives us FormData (no onSubmit/preventDefault needed). */}
        <form action={submitAction} noValidate className="space-y-4 px-4 pb-4">
          <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            AI suggestions. Review and edit anything, then create the task or cancel.
          </p>
          <TaskFormFields task={generateState.task} />
          {submitState && <p role="alert" className="text-sm text-destructive">{submitState.error}</p>}
          <div className="flex gap-2">
            <SubmitButton label="Create task" pendingLabel="Creating..." />
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </ViewTransition>
    );
  }

  // Step 1 screen: just the title input and the "Generate with AI" button.
  return (
    <ViewTransition key="title">
      <form action={generateAction} noValidate className="space-y-4 px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="task-title">Task title</Label>
          <Input
            id="task-title"
            name="title"
            defaultValue={generateState.title}
            placeholder="e.g. Implement user registration"
          />
        </div>
        {/* Show the error from the generate action, if any. */}
        {generateState.status === "error" && <p role="alert" className="text-sm text-destructive">{generateState.message}</p>}
        {generateState.status === "clarify" && (
          <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            The title is a bit vague. {generateState.question} Make the title more specific and try again.
          </p>
        )}
        <div className="flex gap-2">
          <SubmitButton label={generateState.status === "error" ? "Try again" : "Generate with AI"} pendingLabel="Generating..." icon={<Sparkles className="size-4" />} />
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </ViewTransition>
  );
}
