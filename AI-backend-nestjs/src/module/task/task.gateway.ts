import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Request } from 'express';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma.service.js';
import { AUTH_COOKIE, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TASK_EVENTS, projectRoom, userRoom } from './task.events.js';
import type { TaskWithAssignee } from './task.service.js';

// Gateway = the WebSocket version of a controller: it handles real-time connections instead of HTTP routes.
@WebSocketGateway()
export class TaskGateway implements OnGatewayConnection {
  // Logger for debug messages.
  private readonly logger = new Logger(TaskGateway.name);

  // Nest injects the Socket.IO server here so we can send messages to clients.
  @WebSocketServer()
  server!: Server;

  // guard checks the login cookie; prisma looks up which projects the user has tasks in.
  constructor(
    private readonly guard: JwtAuthGuard,
    private readonly prisma: PrismaService,
  ) {}

  // Same check as the REST guard, on the handshake cookie. Runs again on every reconnect.
  // The client asks for nothing: the server puts it in the room of every project it has a task in.
  // Runs every time a client connects. A 'room' is a named group of sockets; we can message everyone in it at once.
  async handleConnection(client: Socket) {
    try {
      // Cookies from the connection handshake (filled in by cookieParser in SocketIoAdapter).
      const { cookies } = client.request as Request;
      // Check the JWT; throws if the user is not logged in.
      const user = await this.guard.userFromToken(cookies?.[AUTH_COOKIE] as string | undefined);
      // Find the distinct projects where this user has an assigned task.
      const projects = await this.prisma.task.findMany({
        where: { assigneeId: user.id },
        distinct: ['projectId'],
        select: { projectId: true },
      });
      // Put the socket in its own user room plus a room for each of its projects.
      await client.join([userRoom(user.id), ...projects.map((p) => projectRoom(p.projectId))]);
    // Not logged in (or anything failed): close the connection.
    } catch {
      this.logger.debug(`Rejected unauthenticated socket ${client.id}`);
      client.disconnect(true);
    }
  }

  // Tell everyone in the project room that a new task was created.
  emitCreated(task: TaskWithAssignee) {
    // A newly assigned user joins the project room first, so they receive this task too.
    // Make all of the assignee's open tabs join the project room, so they also get this event.
    if (task.assigneeId) this.server.in(userRoom(task.assigneeId)).socketsJoin(projectRoom(task.projectId));
    // Broadcast the new task to the project room.
    this.server.to(projectRoom(task.projectId)).emit(TASK_EVENTS.created, task);
  }

  // Tell everyone in the project room that a task's status changed.
  emitStatusUpdated(task: TaskWithAssignee) {
    this.server.to(projectRoom(task.projectId)).emit(TASK_EVENTS.statusUpdated, task);
  }
}
