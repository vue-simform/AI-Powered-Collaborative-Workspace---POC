// A project as returned by the backend (dates arrive as ISO strings).
export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// Data the user must provide to create a project.
export type CreateProjectInput = { name: string; description: string };
