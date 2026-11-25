var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiService_1;
import { BadGatewayException, HttpException, HttpStatus, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '@google/genai';
import { PrismaService } from '../../prisma.service.js';
import { KnowledgeService } from '../document/knowledge.service.js';
import { ProjectService } from '../project/project.service.js';
import { buildPrompt, responseSchema, SYSTEM_INSTRUCTION } from './ai.prompt.js';
import { parseResponse } from './ai.result.js';
import { GEMINI_CLIENT } from './gemini.client.js';
const DEFAULT_MODEL = 'gemini-3.5-flash';
let AiService = AiService_1 = class AiService {
    gemini;
    config;
    prisma;
    projects;
    knowledge;
    logger = new Logger(AiService_1.name);
    constructor(gemini, config, prisma, projects, knowledge) {
        this.gemini = gemini;
        this.config = config;
        this.prisma = prisma;
        this.projects = projects;
        this.knowledge = knowledge;
    }
    async generateTask(dto) {
        if (!this.gemini)
            throw new ServiceUnavailableException('AI is not configured');
        const project = await this.projects.findOne(dto.projectId);
        const title = dto.title.trim();
        const existing = await this.prisma.task.findMany({
            where: { projectId: project.id },
            select: { title: true },
            orderBy: { createdAt: 'desc' },
            take: 15,
        });
        const query = [title, dto.description, dto.additionalInstructions].filter(Boolean).join('\n');
        const found = await this.knowledge.search(project.id, query);
        const chunks = new Map(found.chunks.map((chunk, i) => [`c${i + 1}`, chunk]));
        const prompt = buildPrompt({ dto, title, project, existingTitles: existing.map((t) => t.title), chunks });
        const text = await this.callGemini(prompt);
        return parseResponse(text, { title, chunks });
    }
    async callGemini(prompt) {
        try {
            const response = await this.gemini.models.generateContent({
                model: this.config.get('GEMINI_MODEL') || DEFAULT_MODEL,
                contents: prompt,
                config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseJsonSchema: responseSchema, temperature: 0.4 },
            });
            return response.text;
        }
        catch (e) {
            this.logger.error(`Gemini request failed: ${e instanceof ApiError ? `${e.status} ` : ''}${e.message}`);
            throw this.toHttpError(e);
        }
    }
    toHttpError(e) {
        const status = e instanceof ApiError ? e.status : undefined;
        if (status === 429)
            return new HttpException('AI rate limit reached, please try again shortly', HttpStatus.TOO_MANY_REQUESTS);
        if (status === 503)
            return new ServiceUnavailableException('AI is busy right now, please try again in a moment');
        if (status === 401 || status === 403)
            return new BadGatewayException('AI is not configured correctly');
        if (status === 404)
            return new BadGatewayException('AI model was not found. Check GEMINI_MODEL in the backend .env');
        return new BadGatewayException('AI service is unavailable, please try again');
    }
};
AiService = AiService_1 = __decorate([
    Injectable(),
    __param(0, Inject(GEMINI_CLIENT)),
    __metadata("design:paramtypes", [Object, ConfigService,
        PrismaService,
        ProjectService,
        KnowledgeService])
], AiService);
export { AiService };
//# sourceMappingURL=ai.service.js.map