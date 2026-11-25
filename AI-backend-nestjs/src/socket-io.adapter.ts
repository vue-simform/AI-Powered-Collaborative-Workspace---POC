import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import type { ServerOptions } from 'socket.io';

// Same CORS rules as the REST API (see main.ts), so the browser may send the auth cookie.
// Adapter = the bridge between Nest and Socket.IO (real-time WebSockets). We customise it to set CORS and cookies.
export class SocketIoAdapter extends IoAdapter {
  // Nest calls this to build the Socket.IO server; we add our CORS options to the defaults.
  createIOServer(port: number, options: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3001', credentials: true },
    });
    server.engine.use(cookieParser()); // fills request.cookies for the handshake, like HTTP requests
    return server;
  }
}
