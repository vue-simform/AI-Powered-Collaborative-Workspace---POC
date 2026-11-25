import { BadGatewayException, HttpException, HttpStatus, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from '@google/genai';
import { PrismaService } from '../../prisma.service.js';
import { KnowledgeService } from '../document/knowledge.service.js';
import { ProjectService } from '../project/project.service.js';
import type { GenerateTaskDto } from './ai.dto.js';
import { buildPrompt, responseSchema, SYSTEM_INSTRUCTION } from './ai.prompt.js';
import { type GenerateTaskResult, parseResponse } from './ai.result.js';
import { GEMINI_CLIENT, type GeminiClient } from './gemini.client.js';

// Which Gemini model to use if GEMINI_MODEL is not set in .env.
const DEFAULT_MODEL = 'gemini-3.5-flash';

// Re-exported so other files can keep importing these types from here.
export type { ContextStatus, GenerateTaskResult, Requirement, SourceRef } from './ai.result.js';

// This service is the "manager" of task generation. It does the steps in order and leaves the details to helpers:
//   ai.prompt.ts = what we ask Gemini        ai.result.ts = checking what Gemini answers
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Nest gives us: the Gemini client (null if no API key), .env config, database, projects and document search.
  constructor(
    @Inject(GEMINI_CLIENT) private readonly gemini: GeminiClient | null,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly projects: ProjectService,
    private readonly knowledge: KnowledgeService,
  ) {}

  // Suggests task details. It never writes to the database, and the model has no tools or database access.
  async generateTask(dto: GenerateTaskDto): Promise<GenerateTaskResult> {
    // 1. No API key means the AI feature is off.
    if (!this.gemini) throw new ServiceUnavailableException('AI is not configured');

    // 2. Load the project (404 if missing) and its latest task titles, so the AI avoids duplicates.
    const project = await this.projects.findOne(dto.projectId);
    const title = dto.title.trim();
    const existing = await this.prisma.task.findMany({
      where: { projectId: project.id },
      select: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // 3. RAG: search this project's documents for text related to the task.
    //    The excerpts get short ids (c1, c2, ...) that the AI uses to cite its sources.
    const query = [title, dto.description, dto.additionalInstructions].filter(Boolean).join('\n');
    const found = await this.knowledge.search(project.id, query);
    const chunks = new Map(found.chunks.map((chunk, i) => [`c${i + 1}`, chunk]));

    // 4. Ask Gemini.
    const prompt = buildPrompt({ dto, title, project, existingTitles: existing.map((t) => t.title), chunks });
    const text = await this.callGemini(prompt);

    // 5. Check the answer before returning it.
    return parseResponse(text, { title, chunks });
  }

  // Sends the prompt to Gemini and returns the raw JSON text. Google errors become friendly HTTP errors.
  private async callGemini(prompt: string) {
    try {
      // temperature 0.4 = fairly focused. JSON mode + schema force a structured reply.
      const response = await this.gemini!.models.generateContent({
        model: this.config.get<string>('GEMINI_MODEL') || DEFAULT_MODEL,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseJsonSchema: responseSchema, temperature: 0.4 },
      });
      return response.text;
    } catch (e) {
      // The real cause goes to the server log; the user only gets a simple message.
      this.logger.error(`Gemini request failed: ${e instanceof ApiError ? `${e.status} ` : ''}${(e as Error).message}`);
      throw this.toHttpError(e);
    }
  }

  // Maps Google's status codes to messages the user can understand.
  private toHttpError(e: unknown) {
    const status = e instanceof ApiError ? e.status : undefined;
    if (status === 429) return new HttpException('AI rate limit reached, please try again shortly', HttpStatus.TOO_MANY_REQUESTS);
    if (status === 503) return new ServiceUnavailableException('AI is busy right now, please try again in a moment');
    if (status === 401 || status === 403) return new BadGatewayException('AI is not configured correctly');
    if (status === 404) return new BadGatewayException('AI model was not found. Check GEMINI_MODEL in the backend .env');
    return new BadGatewayException('AI service is unavailable, please try again');
  }
}
