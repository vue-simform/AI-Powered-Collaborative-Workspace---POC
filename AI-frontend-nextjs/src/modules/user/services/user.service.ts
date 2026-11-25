import { api } from "@/lib/api";
import type { User } from "@/modules/user/types/user.types";

// GET /users: returns all users (for example to pick an assignee).
export async function getUsers() {
  return (await api.get<User[]>("/users")).data;
}
