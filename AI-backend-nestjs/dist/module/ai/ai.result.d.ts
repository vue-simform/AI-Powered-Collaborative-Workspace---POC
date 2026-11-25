import type { KnowledgeChunk } from '../document/knowledge.service.js';
import { GeneratedTaskDto, type RequirementStatus } from './ai.dto.js';
export type SourceRef = {
    documentName: string;
    pageNumber: number | null;
    section: string | null;
};
export type Requirement = {
    text: string;
    status: RequirementStatus;
    sources: SourceRef[];
};
export type ContextStatus = 'NO_CONTEXT' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';
export type GenerateTaskResult = {
    status: 'ok';
    task: GeneratedTaskDto;
    requirements: Requirement[];
    suggestions: string[];
    contextStatus: ContextStatus;
    contextMessage: string;
} | {
    status: 'needs_clarification';
    question: string;
};
export type SearchInfo = {
    title: string;
    chunks: Map<string, KnowledgeChunk>;
};
export declare function assess(search: SearchInfo, requirements: Requirement[], assessment: string): {
    contextStatus: "NO_CONTEXT";
    contextMessage: string;
} | {
    contextStatus: "NOT_SUPPORTED";
    contextMessage: string;
} | {
    contextStatus: "SUPPORTED";
    contextMessage: string;
} | {
    contextStatus: "PARTIALLY_SUPPORTED";
    contextMessage: string;
};
export declare function parseResponse(text: string | undefined, search: SearchInfo): Promise<GenerateTaskResult>;
