import { api } from "@/lib/api";
import type { LoginInput, RegisterInput, User } from "@/modules/auth/types/auth.types";

// GET /auth/me: who is logged in (based on the cookie). Fails with 401 when logged out.
export async function getMe() {
  return (await api.get<{ user: User }>("/auth/me")).data.user;
}

// POST /auth/login: the server sets the session cookie on success.
export async function login(input: LoginInput) {
  await api.post("/auth/login", input);
}

// POST /auth/register: creates the account (does not log in by itself).
export async function register(input: RegisterInput) {
  await api.post("/auth/register", input);
}

// POST /auth/logout: the server clears the session cookie.
export async function logout() {
  await api.post("/auth/logout");
}
