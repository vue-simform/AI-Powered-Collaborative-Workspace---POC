import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service.js';
import { ProjectService } from '../project/project.service.js';
import { CreateTaskDto } from './task.dto.js';
import { TaskGateway } from './task.gateway.js';

// Every task sent to the client (REST or socket) carries who it is assigned to.
// Prisma 'include' option: also load the assignee (only id, name, email, no password hash) with each task.
const withAssignee = { assignee: { select: { id: true, name: true, email: true } } } satisfies Prisma.TaskInclude;
// TypeScript type of a task including its assignee, derived from the include above so they never drift apart.
export type TaskWithAssignee = Prisma.TaskGetPayload<{ include: typeof withAssignee }>;

// Business logic for tasks.
@Injectable()
export class TaskService {
  // Dependencies: database, project lookups, and the gateway for real-time broadcasts.
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectService,
    private readonly gateway: TaskGateway,
  ) {}

  // List a project's tasks, oldest first.
  async findByProject(projectId: string) {
    // Throws 404 if the project does not exist.
    await this.projects.findOne(projectId);
    return this.prisma.task.findMany({ where: { projectId }, include: withAssignee, orderBy: { createdAt: 'asc' } });
  }

  // Create a task in a project and notify connected clients.
  async create(projectId: string, dto: CreateTaskDto) {
    await this.projects.findOne(projectId);
    // If an assignee is given, check that the user really exists (otherwise 400).
    if (dto.assigneeId && !(await this.prisma.user.findUnique({ where: { id: dto.assigneeId } }))) {
      throw new BadRequestException('Assignee not found');
    }
    // Save the task; optional fields get safe defaults (empty text/lists, no assignee).
    const task = await this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description ?? '',
        priority: dto.priority,
        estimatedEffort: dto.estimatedEffort,
        status: dto.status,
        acceptanceCriteria: dto.acceptanceCriteria ?? [],
        subtasks: dto.subtasks ?? [],
        technicalConsiderations: dto.technicalConsiderations ?? [],
        assigneeId: dto.assigneeId ?? null,
        projectId,
      },
      include: withAssignee,
    });
    // Push the new task to everyone watching the project in real time.
    this.gateway.emitCreated(task);
    return task;
  }

  // Change a task's status and notify connected clients.
  async updateStatus(taskId: string, status: TaskStatus) {
    // Make sure the task exists first.
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    // Save the new status and reload the task with its assignee.
    const updated = await this.prisma.task.update({ where: { id: taskId }, data: { status }, include: withAssignee });
    // Real-time update so other users' boards change without refreshing.
    this.gateway.emitStatusUpdated(updated);
    return updated;
  }
}
