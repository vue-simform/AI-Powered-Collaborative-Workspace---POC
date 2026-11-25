// 'use client': uses hooks (data fetching), so it runs in the browser.
"use client";

import { ViewTransition } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/modules/auth/hooks/auth.hooks";
import { useProjects } from "@/modules/project/hooks/project.hooks";
import { TaskStats } from "@/modules/task/components/task-stats";
import { useProjectTasks } from "@/modules/task/hooks/task.hooks";

// Dashboard content: greeting, the (single) demo project card and its task statistics.
export function DashboardView() {
  const { user } = useAuth();
  const projectsQuery = useProjects();
  const project = projectsQuery.data?.[0]; // single demo project for now
  const tasksQuery = useProjectTasks(project?.id);

  // Heading reused by the loading, error, empty and normal states below.
  const header = (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
    </div>
  );

  // Loading state: show grey placeholder blocks (skeletons).
  if (projectsQuery.isLoading || tasksQuery.isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Error state: show a message and a Retry button that re-runs both requests.
  if (projectsQuery.isError || tasksQuery.isError) {
    return (
      <div className="space-y-4">
        {header}
        <p role="alert" className="text-sm text-destructive">Could not load dashboard data.</p>
        <Button variant="outline" onClick={() => { projectsQuery.refetch(); tasksQuery.refetch(); }}>Retry</Button>
      </div>
    );
  }

  // Empty state: no projects exist yet.
  if (!project) {
    return (
      <div className="space-y-4">
        {header}
        <p className="text-muted-foreground">No projects yet. Run <code>pnpm db:seed</code> in the backend to add the demo project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Same name as the icon on the project page, so it morphs when you open the project. */}
          <ViewTransition name={`project-${project.id}`} share="morph" default="none">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FolderKanban className="size-5" />
            </span>
          </ViewTransition>
          <div>
            <p className="font-medium">{project.name}</p>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <Link href={`/projects/${project.id}`} className={buttonVariants()}>Open project</Link>
      </div>
      <TaskStats tasks={tasksQuery.data ?? []} />
    </div>
  );
}
