import { CircleCheck, ClipboardList, Clock, ListTodo, OctagonAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { taskStats } from "@/modules/task/utils/task.utils";
import type { Task } from "@/modules/task/types/task.types";

// Dashboard summary: count cards per status plus a progress bar. Server-friendly (no hooks needed).
export function TaskStats({ tasks }: { tasks: Task[] }) {
  // All numbers are calculated from the task list.
  const s = taskStats(tasks);
  // Config for the five stat cards: text, number, icon and color.
  const items = [
    { label: "Total Tasks", value: s.total, icon: ClipboardList, color: "bg-indigo-50 text-indigo-600" },
    { label: "To Do", value: s.todo, icon: ListTodo, color: "bg-slate-100 text-slate-600" },
    { label: "In Progress", value: s.inProgress, icon: Clock, color: "bg-sky-50 text-sky-600" },
    { label: "Completed", value: s.completed, icon: CircleCheck, color: "bg-emerald-50 text-emerald-600" },
    { label: "Blocked", value: s.blocked, icon: OctagonAlert, color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* One card per stat. */}
        {items.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} size="sm" className="shadow-sm">
            <CardContent className="flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl leading-none font-semibold">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card size="sm" className="shadow-sm">
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Project Progress</span>
            <span className="font-semibold text-primary">{s.progress}%</span>
          </div>
          {/* Progress bar: the inner div's width equals the completed percentage. */}
          <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={s.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${s.progress}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
