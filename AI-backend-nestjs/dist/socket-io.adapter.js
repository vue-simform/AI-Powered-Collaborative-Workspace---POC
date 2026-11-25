import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
export class SocketIoAdapter extends IoAdapter {
    createIOServer(port, options) {
        const server = super.createIOServer(port, {
            ...options,
            cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3001', credentials: true },
        });
        server.engine.use(cookieParser());
        return server;
    }
}
//# sourceMappingURL=socket-io.adapter.js.map