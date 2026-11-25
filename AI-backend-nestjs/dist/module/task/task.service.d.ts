import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service.js';
import { ProjectService } from '../project/project.service.js';
import { CreateTaskDto } from './task.dto.js';
import { TaskGateway } from './task.gateway.js';
declare const withAssignee: {
    assignee: {
        select: {
            id: true;
            name: true;
            email: true;
        };
    };
};
export type TaskWithAssignee = Prisma.TaskGetPayload<{
    include: typeof withAssignee;
}>;
export declare class TaskService {
    private readonly prisma;
    private readonly projects;
    private readonly gateway;
    constructor(prisma: PrismaService, projects: ProjectService, gateway: TaskGateway);
    findByProject(projectId: string): Promise<({
        assignee: {
            name: string;
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        projectId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        title: string;
        priority: import("@prisma/client").$Enums.Priority;
        estimatedEffort: number;
        acceptanceCriteria: string[];
        subtasks: string[];
        technicalConsiderations: string[];
        assigneeId: string | null;
    })[]>;
    create(projectId: string, dto: CreateTaskDto): Promise<{
        assignee: {
            name: string;
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        projectId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        title: string;
        priority: import("@prisma/client").$Enums.Priority;
        estimatedEffort: number;
        acceptanceCriteria: string[];
        subtasks: string[];
        technicalConsiderations: string[];
        assigneeId: string | null;
    }>;
    updateStatus(taskId: string, status: TaskStatus): Promise<{
        assignee: {
            name: string;
            email: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        projectId: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        title: string;
        priority: import("@prisma/client").$Enums.Priority;
        estimatedEffort: number;
        acceptanceCriteria: string[];
        subtasks: string[];
        technicalConsiderations: string[];
        assigneeId: string | null;
    }>;
}
export {};
