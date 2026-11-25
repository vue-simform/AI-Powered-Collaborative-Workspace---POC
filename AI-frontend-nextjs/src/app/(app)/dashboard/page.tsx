import { DashboardView } from "@/modules/dashboard/components/dashboard-view";

// Content renders after the client-side session check, so this page can't be instant.
export const instant = false;

// The '/dashboard' page; the real UI lives in DashboardView.
export default function DashboardPage() {
  return <DashboardView />;
}
