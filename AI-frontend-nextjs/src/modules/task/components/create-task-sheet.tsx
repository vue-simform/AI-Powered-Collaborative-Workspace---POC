"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Task } from "@/modules/task/types/task.types";
import { CreateTaskFlow } from "./create-task-flow";

// Slide-in side panel (Sheet) that wraps the create-task flow. `open` is controlled by the board.
export function CreateTaskSheet({
  projectId,
  open,
  onOpenChange,
  onOptimisticAdd,
  onCreated,
  onError,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticAdd: (task: Task) => void;
  onCreated: (title: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>New task</SheetTitle>
          <SheetDescription>Enter a title and let AI suggest the details. Nothing is saved until you approve.</SheetDescription>
        </SheetHeader>
        <CreateTaskFlow
          projectId={projectId}
          onClose={() => onOpenChange(false)}
          onOptimisticAdd={onOptimisticAdd}
          onCreated={onCreated}
          onError={onError}
        />
      </SheetContent>
    </Sheet>
  );
}
