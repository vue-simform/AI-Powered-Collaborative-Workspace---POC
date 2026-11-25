"use client";

import { startTransition, useOptimistic, useState, ViewTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage } from "@/lib/api";
import { Clock } from "lucide-react";
import { PRIORITIES, PRIORITY_STYLES, STATUSES, STATUS_STYLES } from "@/modules/task/constants/task.constants";
import { useUpdateTaskStatus } from "@/modules/task/hooks/task.hooks";
import { priorityLabel, statusLabel } from "@/modules/task/utils/task.utils";
import type { Priority, Task, TaskStatus } from "@/modules/task/types/task.types";
import { CreateTaskSheet } from "./create-task-sheet";
import { TaskDetailsSheet } from "./task-details-sheet";

// Temporary cards get ids starting with this, so we can tell "still saving" from real tasks.
const OPTIMISTIC_PREFIX = "optimistic-";

// Options for the priority filter dropdown: an extra "All" choice plus the real priorities.
const priorityFilters = [{ value: "ALL", label: "All priorities" }, ...PRIORITIES];

// The main Kanban board: filters, columns by status, cards, and the create/details sheets.
export function TaskBoard({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  // Tasks shown on the board: the server list plus any task that is still being saved.
  // useOptimistic reverts by itself if the create request fails.
  // useOptimistic(realData, reducer): returns the data plus a function to add a temporary item on top of it.
  const [boardTasks, addOptimisticTask] = useOptimistic(tasks, (current, task: Task) => [...current, task]);

  // Local UI state. It lives here (not in TanStack Query) and is kept alive by <Activity> on the page.
  // Filter and UI state is kept locally in this component.
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mutation that moves a task to another status on the server.
  const updateStatus = useUpdateTaskStatus(projectId);

  // Called from the card dropdown or details sheet. Skips no-op changes and shows a success/error notice.
  const changeStatus = (task: Task, status: TaskStatus) => {
    if (status === task.status) return;
    updateStatus.mutate(
      { task, status },
      {
        onSuccess: () => setNotice({ type: "success", text: `"${task.title}" moved to ${statusLabel(status)}` }),
        onError: (err) => setNotice({ type: "error", text: errorMessage(err, "Could not update status") }),
      },
    );
  };

  // Apply the search text and priority filter to the tasks (case-insensitive match on title and description).
  const term = search.trim().toLowerCase();
  const visible = boardTasks.filter(
    (t) =>
      (priority === "ALL" || t.priority === priority) &&
      (!term || t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:w-64"
          placeholder="Search tasks..."
          aria-label="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select items={priorityFilters} value={priority} onValueChange={(v) => v && setPriority(v as Priority | "ALL")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {priorityFilters.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>New task</Button>
      </div>

      {notice && (
        <p role={notice.type === "error" ? "alert" : "status"} className={`text-sm ${notice.type === "error" ? "text-destructive" : "text-green-600"}`}>
          {notice.text}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* One column per status. */}
        {STATUSES.map((col) => {
          // Cards that belong to this column.
          const items = visible.filter((t) => t.status === col.value);
          return (
            <section key={col.value} className="rounded-xl border bg-muted/50 p-3" aria-label={col.label}>
              <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${STATUS_STYLES[col.value].dot}`} />
                  {col.label}
                </span>
                <Badge variant="secondary">{items.length}</Badge>
              </h3>
              <div className="space-y-3">
                {items.length === 0 && <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">No tasks</p>}
                {items.map((task) => {
                  // A card with an optimistic id is still being saved, so its controls are disabled.
                  const saving = task.id.startsWith(OPTIMISTIC_PREFIX);
                  return (
                  // A new card animates in (e.g. when the AI preview closes and the saving card appears).
                  <ViewTransition key={task.id} enter="auto" default="none">
                  {/* Task card. */}
                  <article className="space-y-3 rounded-xl border bg-card p-3 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
                    {/* startTransition marks the open-details update as non-urgent, so the UI stays responsive. */}
                    <button type="button" className="block w-full text-left" disabled={saving} onClick={() => startTransition(() => setSelectedId(task.id))}>
                      <p className="font-medium">{task.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{task.description || "No description"}</p>
                    </button>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge className={PRIORITY_STYLES[task.priority]}>{priorityLabel(task.priority)}</Badge>
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" />{task.estimatedEffort}h</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 ${STATUS_STYLES[task.status].chip}`}>{saving ? "Saving..." : statusLabel(task.status)}</span>
                    </div>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                        {task.assignee ? task.assignee.name.charAt(0).toUpperCase() : "?"}
                      </span>
                      {task.assignee?.name ?? "Unassigned"}
                    </p>
                    {/* Quick status change right on the card. */}
                    <Select items={STATUSES} value={task.status} disabled={saving} onValueChange={(v) => v && changeStatus(task, v as TaskStatus)}>
                      <SelectTrigger size="sm" className="w-full" aria-label={`Status of ${task.title}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </article>
                  </ViewTransition>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {boardTasks.length === 0 && <p className="text-center text-sm text-muted-foreground">No tasks yet. Create the first one.</p>}

      {/* Side panel for creating a task. */}
      <CreateTaskSheet
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onOptimisticAdd={addOptimisticTask}
        onCreated={(title) => setNotice({ type: "success", text: `Task "${title}" created` })}
        onError={(message) => setNotice({ type: "error", text: message })}
      />
      {/* Side panel with full task info; it is open while a task is selected. Looks up the real task (not the temporary one). */}
      <TaskDetailsSheet
        task={tasks.find((t) => t.id === selectedId)}
        onClose={() => startTransition(() => setSelectedId(null))}
        onStatusChange={changeStatus}
      />
    </div>
  );
}
