var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { ProjectService } from '../project/project.service.js';
import { TaskGateway } from './task.gateway.js';
const withAssignee = { assignee: { select: { id: true, name: true, email: true } } };
let TaskService = class TaskService {
    prisma;
    projects;
    gateway;
    constructor(prisma, projects, gateway) {
        this.prisma = prisma;
        this.projects = projects;
        this.gateway = gateway;
    }
    async findByProject(projectId) {
        await this.projects.findOne(projectId);
        return this.prisma.task.findMany({ where: { projectId }, include: withAssignee, orderBy: { createdAt: 'asc' } });
    }
    async create(projectId, dto) {
        await this.projects.findOne(projectId);
        if (dto.assigneeId && !(await this.prisma.user.findUnique({ where: { id: dto.assigneeId } }))) {
            throw new BadRequestException('Assignee not found');
        }
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
        this.gateway.emitCreated(task);
        return task;
    }
    async updateStatus(taskId, status) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task)
            throw new NotFoundException('Task not found');
        const updated = await this.prisma.task.update({ where: { id: taskId }, data: { status }, include: withAssignee });
        this.gateway.emitStatusUpdated(updated);
        return updated;
    }
};
TaskService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        ProjectService,
        TaskGateway])
], TaskService);
export { TaskService };
//# sourceMappingURL=task.service.js.map