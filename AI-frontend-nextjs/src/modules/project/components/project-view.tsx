// 'use client': uses state and hooks, so it runs in the browser.
"use client";

import { Activity, useState, ViewTransition } from "react";
import { useParams } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { ProjectDocuments } from "@/modules/document/components/project-documents";
import { TaskBoard } from "@/modules/task/components/task-board";
import { TaskStats } from "@/modules/task/components/task-stats";
import { useProjectTasks } from "@/modules/task/hooks/task.hooks";
import { useProject } from "@/modules/project/hooks/project.hooks";
import { TeamActivity } from "./team-activity";

// Project detail page: header, task statistics and three tabs (Board, Team Activity, Documents).
export function ProjectView() {
  // Read the project id from the URL (/projects/<projectId>).
  const { projectId } = useParams<{ projectId: string }>();
  // Which tab is currently selected.
  const [tab, setTab] = useState<"board" | "activity" | "documents">("board");

  // Load the project itself and its tasks (two separate requests).
  const projectQuery = useProject(projectId);
  const tasksQuery = useProjectTasks(projectId);

  // Loading state: skeleton placeholders.
  if (projectQuery.isLoading || tasksQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state: show the message and a Retry button that refetches both queries.
  if (projectQuery.isError || tasksQuery.isError || !projectQuery.data) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive">{errorMessage(projectQuery.error ?? tasksQuery.error, "Could not load project")}</p>
        <Button variant="outline" onClick={() => { projectQuery.refetch(); tasksQuery.refetch(); }}>Retry</Button>
      </div>
    );
  }

  // From here on the data is loaded successfully.
  const project = projectQuery.data;
  const tasks = tasksQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {/* ViewTransition animates this icon smoothly between the dashboard and this page (same name = same element). */}
        <ViewTransition name={`project-${project.id}`} share="morph" default="none">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FolderKanban className="size-6" />
          </span>
        </ViewTransition>
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {new Date(project.createdAt).toLocaleDateString()} · {tasks.length} tasks
          </p>
        </div>
      </div>

      {/* Summary numbers about the tasks. */}
      <TaskStats tasks={tasks} />

      {/* Tab buttons, built from a small [key, label] list. */}
      <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
        {([["board", "Board"], ["activity", "Team Activity"], ["documents", "Documents"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${tab === key ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity keeps the hidden tab mounted, so the board's search and filter survive tab switches. */}
      {/* Board tab */}
      <Activity mode={tab === "board" ? "visible" : "hidden"}>
        <TaskBoard projectId={projectId} tasks={tasks} />
      </Activity>
      {/* Team Activity tab */}
      <Activity mode={tab === "activity" ? "visible" : "hidden"}>
        <TeamActivity tasks={tasks} />
      </Activity>
      {/* Documents tab */}
      <Activity mode={tab === "documents" ? "visible" : "hidden"}>
        <ProjectDocuments projectId={projectId} />
      </Activity>
    </div>
  );
}
