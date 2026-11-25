import { AppShell } from "@/components/app-shell";

// Pages here render only after the client-side session check, so they can't be instant.
// '(app)' is a route group: the brackets keep it out of the URL, but all pages inside share this layout.
export const instant = false;

// Wraps every logged-in page (dashboard, projects) in the sidebar shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
