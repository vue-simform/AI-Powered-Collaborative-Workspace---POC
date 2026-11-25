import { api } from "@/lib/api";
import type { CreateProjectInput, Project } from "@/modules/project/types/project.types";

// GET /projects: list all projects.
export async function getProjects() {
  return (await api.get<Project[]>("/projects")).data;
}

// GET /projects/:id: fetch one project.
export async function getProject(id: string) {
  return (await api.get<Project>(`/projects/${id}`)).data;
}

// POST /projects: create a project and return the saved one.
export async function createProject(input: CreateProjectInput) {
  return (await api.post<Project>("/projects", input)).data;
}
