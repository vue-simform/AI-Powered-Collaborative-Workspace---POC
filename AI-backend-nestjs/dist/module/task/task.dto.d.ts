import { Priority, TaskStatus } from '@prisma/client';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    priority: Priority;
    estimatedEffort: number;
    status?: TaskStatus;
    assigneeId?: string;
    acceptanceCriteria?: string[];
    subtasks?: string[];
    technicalConsiderations?: string[];
}
export declare class UpdateStatusDto {
    status: TaskStatus;
}
