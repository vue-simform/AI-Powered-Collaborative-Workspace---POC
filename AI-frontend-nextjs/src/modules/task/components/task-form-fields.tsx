"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, STATUSES, UNASSIGNED } from "@/modules/task/constants/task.constants";
import type { Priority, GeneratedTask, TaskStatus } from "@/modules/task/types/task.types";
import { useUsers } from "@/modules/user/hooks/user.hooks";
import { ListField } from "./list-field";

// The form the manager reviews (prefilled by Gemini) and edits before approving a task. Values are read by the form action via their `name`.
export function TaskFormFields({ task }: { task: GeneratedTask }) {
  // Each field is controlled by state (the value lives in React). Inputs have a `name`, so form actions can read them via FormData.
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [effort, setEffort] = useState(String(task.estimatedEffort));
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [assignee, setAssignee] = useState(UNASSIGNED);
  // Users for the assignee dropdown.
  const { data: users = [] } = useUsers();
  // Dropdown options: "Unassigned" first, then every user.
  const assignees = [{ value: UNASSIGNED, label: "Unassigned" }, ...users.map((u) => ({ value: u.id, label: u.name }))];

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input id="task-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea id="task-description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select name="priority" items={PRIORITIES} value={priority} onValueChange={(v) => v && setPriority(v as Priority)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-effort">Effort (h)</Label>
          <Input id="task-effort" name="estimatedEffort" type="number" min={1} value={effort} onChange={(e) => setEffort(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select name="status" items={STATUSES} value={status} onValueChange={(v) => v && setStatus(v as TaskStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Assign to</Label>
        <Select name="assigneeId" items={assignees} value={assignee} onValueChange={(v) => v && setAssignee(v)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {assignees.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <ListField label="Acceptance criteria" name="acceptanceCriteria" initial={task.acceptanceCriteria} />
      <ListField label="Subtasks" name="subtasks" initial={task.subtasks} />
      <ListField label="Technical considerations" name="technicalConsiderations" initial={task.technicalConsiderations} />
    </>
  );
}
