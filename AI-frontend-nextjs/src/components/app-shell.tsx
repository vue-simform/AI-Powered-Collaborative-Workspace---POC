// 'use client' marks this file as a Client Component: it runs in the browser, so it can use state, effects and click handlers.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, Layers, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth/hooks/auth.hooks";
import { useProjects } from "@/modules/project/hooks/project.hooks";
import { SocketProvider } from "@/modules/task/components/socket-provider";
import { CreateProjectSheet } from "@/modules/project/components/create-project-sheet";

// The frame around every logged-in page: sidebar (nav, project list, user box) plus the page content on the right.
// It also guards the pages: if nobody is logged in, it sends the visitor to /login.
export function AppShell({ children }: { children: React.ReactNode }) {
  // Who is logged in, whether we are still checking, and a logout function.
  const { user, isLoading, logout } = useAuth();
  // router lets us change page from code; pathname is the current URL path (used to highlight the active link).
  const router = useRouter();
  const pathname = usePathname();
  // useState remembers a value between renders. Here: is the 'New project' side panel open?
  const [createOpen, setCreateOpen] = useState(false);

  // useEffect runs code after render. Once the session check finishes with no user, redirect to the login page.
  // replace() (not push) so the Back button doesn't return to a page that would redirect again.
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  // Load the project list for the sidebar, but only once we know the user is logged in.
  const { data: projects = [] } = useProjects(!!user);

  // While checking the session (or while redirecting), show a simple loading text instead of the app.
  if (isLoading || !user) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;

  // Returns the CSS classes for a sidebar link: highlighted when it points at the current page.
  const linkClass = (href: string) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
      pathname === href
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      {/* Opens the real-time (websocket) connection so task changes from other users show up live. */}
      <SocketProvider />
      {/* Left sidebar */}
      <aside className="flex flex-col gap-6 border-b bg-sidebar p-4 md:h-screen md:w-64 md:overflow-y-auto md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <span className="font-semibold">AI Workspace</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            <LayoutDashboard className="size-4" /> Dashboard
          </Link>
          <div className="mt-4 mb-1 flex items-center justify-between px-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Projects</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="New project"
              title="New project"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {/* One link per project. key helps React track list items. */}
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className={linkClass(`/projects/${p.id}`)}>
              <FolderKanban className="size-4" /> <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t pt-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout" title="Logout">
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>
      {/* Slide-in form for creating a project; after creation we jump to the new project's page. */}
      <CreateProjectSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => router.push(`/projects/${id}`)}
      />
      {/* The current page's content is injected here via children. */}
      <main className="min-w-0 flex-1 p-6 md:overflow-y-auto md:p-8">{children}</main>
    </div>
  );
}
