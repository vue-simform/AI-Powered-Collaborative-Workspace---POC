import { OnGatewayConnection } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { TaskWithAssignee } from './task.service.js';
export declare class TaskGateway implements OnGatewayConnection {
    private readonly guard;
    private readonly prisma;
    private readonly logger;
    server: Server;
    constructor(guard: JwtAuthGuard, prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    emitCreated(task: TaskWithAssignee): void;
    emitStatusUpdated(task: TaskWithAssignee): void;
}
