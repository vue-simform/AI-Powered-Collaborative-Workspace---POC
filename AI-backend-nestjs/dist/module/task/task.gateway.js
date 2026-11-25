var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskGateway_1;
import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { PrismaService } from '../../prisma.service.js';
import { AUTH_COOKIE, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TASK_EVENTS, projectRoom, userRoom } from './task.events.js';
let TaskGateway = TaskGateway_1 = class TaskGateway {
    guard;
    prisma;
    logger = new Logger(TaskGateway_1.name);
    server;
    constructor(guard, prisma) {
        this.guard = guard;
        this.prisma = prisma;
    }
    async handleConnection(client) {
        try {
            const { cookies } = client.request;
            const user = await this.guard.userFromToken(cookies?.[AUTH_COOKIE]);
            const projects = await this.prisma.task.findMany({
                where: { assigneeId: user.id },
                distinct: ['projectId'],
                select: { projectId: true },
            });
            await client.join([userRoom(user.id), ...projects.map((p) => projectRoom(p.projectId))]);
        }
        catch {
            this.logger.debug(`Rejected unauthenticated socket ${client.id}`);
            client.disconnect(true);
        }
    }
    emitCreated(task) {
        if (task.assigneeId)
            this.server.in(userRoom(task.assigneeId)).socketsJoin(projectRoom(task.projectId));
        this.server.to(projectRoom(task.projectId)).emit(TASK_EVENTS.created, task);
    }
    emitStatusUpdated(task) {
        this.server.to(projectRoom(task.projectId)).emit(TASK_EVENTS.statusUpdated, task);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Function)
], TaskGateway.prototype, "server", void 0);
TaskGateway = TaskGateway_1 = __decorate([
    WebSocketGateway(),
    __metadata("design:paramtypes", [JwtAuthGuard,
        PrismaService])
], TaskGateway);
export { TaskGateway };
//# sourceMappingURL=task.gateway.js.map