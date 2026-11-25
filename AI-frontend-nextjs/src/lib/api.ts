import axios from "axios";

// Shared axios instance used by all service files. baseURL points at the backend '/api' prefix.
// withCredentials makes the browser send the login cookie with each request.
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/api`,
  withCredentials: true,
});

// Turns any thrown error into a short, user-friendly message to show in the UI.
// Uses the backend's message when present, otherwise the fallback text.
export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    // Validation errors can come as a list of messages; join them into one string.
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    // No response at all means the request never reached the server (offline, server down).
    if (!error.response) return "Cannot reach the server";
  }
  return fallback;
}
