import { CheckCircle2, Layers } from "lucide-react";

// Selling points shown in the left banner of the login/register pages.
const points = ["Plan work on a simple Kanban board", "Track progress at a glance", "Keep your whole team in sync"];

// Two-column layout for login/register: decorative banner on the left (large screens only),
// and the form (passed in as children) on the right.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Layers className="size-6" /> AI Workspace
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">Collaborate on projects,<br />ship work faster.</h2>
          <ul className="space-y-3 text-indigo-100">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <CheckCircle2 className="size-5 shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-indigo-200">AI-Powered Collaborative Workspace</p>
      </section>
      <section className="flex items-center justify-center p-4">{children}</section>
    </main>
  );
}
