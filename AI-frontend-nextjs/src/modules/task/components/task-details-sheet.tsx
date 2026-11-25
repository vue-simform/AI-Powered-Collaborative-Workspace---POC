"use client";

import { ViewTransition } from "react";
import { AlignLeft, CircleCheck, Clock, Flag, ListChecks, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PRIORITY_STYLES, STATUSES, STATUS_STYLES } from "@/modules/task/constants/task.constants";
import { priorityLabel, statusLabel } from "@/modules/task/utils/task.utils";
import type { Task, TaskStatus } from "@/modules/task/types/task.types";

// Formats an ISO date string using the user's locale, e.g. "Nov 4, 2026, 3:15 PM".
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Right-hand panel with all details of one task. It is open whenever `task` is defined.
export function TaskDetailsSheet({
  task,
  onClose,
  onStatusChange,
}: {
  task: Task | undefined;
  onClose: () => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  // Closing the sheet (outside click / Esc) calls onClose.
  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 data-[side=right]:sm:max-w-2xl">
        {/* Animate the content in when a task is opened (ViewTransition). */}
        {task && (
          <ViewTransition enter="auto" default="none">
          <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="space-y-3 border-b pb-4">
              <SheetTitle className="pr-8 text-xl leading-snug">{task.title}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[task.status].chip}`}>
                  {statusLabel(task.status)}
                </span>
                <Badge className={PRIORITY_STYLES[task.priority]}>
                  <Flag /> {priorityLabel(task.priority)}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {task.estimatedEffort}h estimated
                </span>
              </div>
              <SheetDescription className="text-xs">
                Created {formatDate(task.createdAt)} · Updated {formatDate(task.updatedAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 text-sm">
              <div className="space-y-2 rounded-xl bg-muted/50 p-3">
                <Label>Status</Label>
                {/* Change the status from inside the panel. */}
                <Select items={STATUSES} value={task.status} onValueChange={(v) => v && onStatusChange(task, v as TaskStatus)}>
                  <SelectTrigger className="w-full bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 rounded-xl bg-muted/50 p-3">
                <Label>Assigned to</Label>
                <p className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {task.assignee ? task.assignee.name.charAt(0).toUpperCase() : "?"}
                  </span>
                  {task.assignee ? `${task.assignee.name} (${task.assignee.email})` : "Unassigned"}
                </p>
              </div>

              <Section icon={<AlignLeft className="size-4" />} title="Description">
                <p className="leading-relaxed text-foreground/90">{task.description || "No description"}</p>
              </Section>

              {/* Lists are hidden automatically when empty. */}
              <ItemList icon={<CircleCheck className="size-4" />} title="Acceptance criteria" items={task.acceptanceCriteria} bullet="check" />
              <ItemList icon={<ListChecks className="size-4" />} title="Subtasks" items={task.subtasks} bullet="number" />
              <ItemList icon={<Wrench className="size-4" />} title="Technical considerations" items={task.technicalConsiderations} bullet="dot" />
            </div>
          </div>
          </ViewTransition>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Small layout helper: an uppercase heading with an icon, followed by its content.
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

// Shows a list of strings as cards with a check, number or dot marker. Renders nothing when the list is empty.
function ItemList({
  icon,
  title,
  items,
  bullet,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  bullet: "check" | "number" | "dot";
}) {
  if (items.length === 0) return null;
  return (
    <Section icon={icon} title={`${title} (${items.length})`}>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 rounded-lg border bg-card p-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
              {bullet === "number" ? i + 1 : bullet === "check" ? "✓" : "•"}
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
