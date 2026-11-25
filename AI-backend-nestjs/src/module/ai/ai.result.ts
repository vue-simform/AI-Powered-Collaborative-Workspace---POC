import { BadGatewayException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { KnowledgeChunk } from '../document/knowledge.service.js';
import { GeneratedAnalysisDto, GeneratedTaskDto, type RequirementStatus } from './ai.dto.js';

// This file answers one question: "Can we TRUST what Gemini sent back?"
// It parses the reply, validates it, checks the sources ourselves, and decides the overall verdict.

// Where a piece of evidence came from: which document, and which page or section.
export type SourceRef = { documentName: string; pageNumber: number | null; section: string | null };
// A requirement plus its proof (the sources). Sources are only those we verified ourselves.
export type Requirement = { text: string; status: RequirementStatus; sources: SourceRef[] };
// Overall verdict on how much the uploaded documents support the task.
export type ContextStatus = 'NO_CONTEXT' | 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';

// What generateTask returns: either a finished suggestion ('ok') or a question asking the user for more detail.
export type GenerateTaskResult =
  | {
      status: 'ok';
      task: GeneratedTaskDto;
      requirements: Requirement[];
      suggestions: string[];
      contextStatus: ContextStatus;
      contextMessage: string;
    }
  | { status: 'needs_clarification'; question: string };

// What we know about the search that was done before calling Gemini.
export type SearchInfo = {
  title: string;
  chunks: Map<string, KnowledgeChunk>; // the excerpts we sent, by short id (c1, c2, ...)
};

const invalid = () => new BadGatewayException('AI returned an invalid response, please try again');

// Step 1: the reply text must be a JSON object.
function readJson(text: string | undefined): Record<string, unknown> {
  try {
    const data = JSON.parse(text ?? '');
    if (data && typeof data === 'object') return data;
  } catch {
    // falls through to the error below
  }
  throw invalid();
}

// Step 2: turn the AI's requirement list into ours. A requirement counts as documented
// ONLY if it points to an excerpt we really sent. Otherwise it is downgraded to NOT_DOCUMENTED.
function verifySources(requirements: GeneratedAnalysisDto['requirements'], chunks: Map<string, KnowledgeChunk>): Requirement[] {
  return requirements.map((r) => {
    const sources = [...new Set(r.sourceChunkIds)].flatMap((id) => {
      const chunk = chunks.get(id);
      return chunk ? [{ documentName: chunk.documentName, pageNumber: chunk.pageNumber, section: chunk.section }] : [];
    });
    if (r.status === 'NOT_DOCUMENTED' || sources.length === 0) return { text: r.text, status: 'NOT_DOCUMENTED', sources: [] };
    return { text: r.text, status: r.status, sources };
  });
}

// Step 3: decide the overall status and a readable message.
export function assess(search: SearchInfo, requirements: Requirement[], assessment: string) {
  const notFound = `"${search.title}" was not found in the uploaded project documentation.`;

  if (search.chunks.size === 0) {
    return { contextStatus: 'NO_CONTEXT' as const, contextMessage: `${notFound} No relevant section was found in the uploaded documents.` };
  }

  const documented = requirements.filter((r) => r.status === 'DOCUMENTED').length;
  const partial = requirements.filter((r) => r.status === 'PARTIALLY_DOCUMENTED').length;

  if (documented + partial === 0) {
    return { contextStatus: 'NOT_SUPPORTED' as const, contextMessage: `${notFound} ${assessment}`.trim() };
  }
  if (documented === requirements.length) {
    return { contextStatus: 'SUPPORTED' as const, contextMessage: assessment || 'All requirements are supported by the project documentation.' };
  }
  return { contextStatus: 'PARTIALLY_SUPPORTED' as const, contextMessage: assessment || 'Some requirements are documented, others are not.' };
}

// Never trust the AI blindly: parse its JSON, validate every field against our DTO rules, check the sources, then return.
export async function parseResponse(text: string | undefined, search: SearchInfo): Promise<GenerateTaskResult> {
  const data = readJson(text);

  // The AI says the title is too vague: pass its question back to the user.
  if (data.needsClarification === true) {
    const question = typeof data.clarificationQuestion === 'string' ? data.clarificationQuestion.trim() : '';
    if (!question) throw invalid();
    return { status: 'needs_clarification', question };
  }

  // Check the task fields (lengths, priority, ...).
  const task = plainToInstance(GeneratedTaskDto, data.task);
  if (!data.task || typeof data.task !== 'object' || (await validate(task, { forbidUnknownValues: true })).length > 0) throw invalid();

  // Check the requirements, suggestions and assessment.
  const analysis = plainToInstance(GeneratedAnalysisDto, {
    requirements: data.requirements ?? [],
    suggestions: data.suggestions ?? [],
    contextAssessment: data.contextAssessment ?? '',
  });
  if ((await validate(analysis, { forbidUnknownValues: true })).length > 0) throw invalid();

  const requirements = verifySources(analysis.requirements, search.chunks);
  const { contextStatus, contextMessage } = assess(search, requirements, analysis.contextAssessment);

  return {
    status: 'ok',
    task,
    requirements,
    suggestions: analysis.suggestions,
    contextStatus,
    contextMessage,
  };
}
