import { STATUS_STYLES } from "@/modules/task/constants/task.constants";
import { statusLabel } from "@/modules/task/utils/task.utils";
import type { Task } from "@/modules/task/types/task.types";

// Lists the 10 most recently changed tasks with their current status and update time.
export function TeamActivity({ tasks }: { tasks: Task[] }) {
  // Copy the array ([...tasks]) before sorting so we don't mutate props; newest first, keep 10.
  const recent = [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10);
  // Nothing to show yet.
  if (recent.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ul className="divide-y rounded-xl border bg-card shadow-sm">
      {recent.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
          <span className="flex items-center gap-2">
            <span className={`size-2.5 shrink-0 rounded-full ${STATUS_STYLES[t.status].dot}`} />
            <span>
              <span className="font-medium">{t.title}</span>{" "}
              <span className="text-muted-foreground">is {statusLabel(t.status)}</span>
            </span>
          </span>
          <time className="shrink-0 text-xs text-muted-foreground">{new Date(t.updatedAt).toLocaleString()}</time>
        </li>
      ))}
    </ul>
  );
}
