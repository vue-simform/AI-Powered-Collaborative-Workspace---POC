import { Priority } from '@prisma/client';
export declare class GenerateTaskDto {
    title: string;
    projectId: string;
    description?: string;
    additionalInstructions?: string;
}
export declare const REQUIREMENT_STATUSES: readonly ["DOCUMENTED", "PARTIALLY_DOCUMENTED", "NOT_DOCUMENTED"];
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];
export declare class RequirementDto {
    text: string;
    status: RequirementStatus;
    sourceChunkIds: string[];
}
export declare class GeneratedAnalysisDto {
    requirements: RequirementDto[];
    suggestions: string[];
    contextAssessment: string;
}
export declare class GeneratedTaskDto {
    title: string;
    description: string;
    priority: Priority;
    estimatedEffort: number;
    acceptanceCriteria: string[];
    subtasks: string[];
    technicalConsiderations: string[];
}
