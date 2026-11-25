import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service.js';
import { KnowledgeService } from '../document/knowledge.service.js';
import { ProjectService } from '../project/project.service.js';
import type { GenerateTaskDto } from './ai.dto.js';
import { type GenerateTaskResult } from './ai.result.js';
import { type GeminiClient } from './gemini.client.js';
export type { ContextStatus, GenerateTaskResult, Requirement, SourceRef } from './ai.result.js';
export declare class AiService {
    private readonly gemini;
    private readonly config;
    private readonly prisma;
    private readonly projects;
    private readonly knowledge;
    private readonly logger;
    constructor(gemini: GeminiClient | null, config: ConfigService, prisma: PrismaService, projects: ProjectService, knowledge: KnowledgeService);
    generateTask(dto: GenerateTaskDto): Promise<GenerateTaskResult>;
    private callGemini;
    private toHttpError;
}
