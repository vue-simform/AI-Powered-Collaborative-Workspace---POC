import { CreateTaskDto, UpdateStatusDto } from './task.dto.js';
import { TaskService } from './task.service.js';
export declare class TaskController {
    private readonly tasks;
    constructor(tasks: TaskService);
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
    updateStatus(taskId: string, dto: UpdateStatusDto): Promise<{
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
