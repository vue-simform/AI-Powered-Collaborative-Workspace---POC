// Socket.IO gives us a live, two-way connection to the server (used for real-time task updates).
import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents } from "@/modules/task/types/task.socket";

// One shared connection. It stays closed until SocketProvider connects it for a signed-in user;
// the HTTP-only auth cookie is sent with the handshake.
export const socket: Socket<ServerToClientEvents> = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000", {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"],
});
