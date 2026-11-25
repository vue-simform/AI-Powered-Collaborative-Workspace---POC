import { ProjectView } from "@/modules/project/components/project-view";

// Content renders after the client-side session check, so this page can't be instant.
export const instant = false;

// The '/projects/<id>' page. The [projectId] folder is a dynamic segment: it matches any project id in the URL.
export default function ProjectPage() {
  return <ProjectView />;
}
