import { BadGatewayException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GeneratedAnalysisDto, GeneratedTaskDto } from './ai.dto.js';
const invalid = () => new BadGatewayException('AI returned an invalid response, please try again');
function readJson(text) {
    try {
        const data = JSON.parse(text ?? '');
        if (data && typeof data === 'object')
            return data;
    }
    catch {
    }
    throw invalid();
}
function verifySources(requirements, chunks) {
    return requirements.map((r) => {
        const sources = [...new Set(r.sourceChunkIds)].flatMap((id) => {
            const chunk = chunks.get(id);
            return chunk ? [{ documentName: chunk.documentName, pageNumber: chunk.pageNumber, section: chunk.section }] : [];
        });
        if (r.status === 'NOT_DOCUMENTED' || sources.length === 0)
            return { text: r.text, status: 'NOT_DOCUMENTED', sources: [] };
        return { text: r.text, status: r.status, sources };
    });
}
export function assess(search, requirements, assessment) {
    const notFound = `"${search.title}" was not found in the uploaded project documentation.`;
    if (search.chunks.size === 0) {
        return { contextStatus: 'NO_CONTEXT', contextMessage: `${notFound} No relevant section was found in the uploaded documents.` };
    }
    const documented = requirements.filter((r) => r.status === 'DOCUMENTED').length;
    const partial = requirements.filter((r) => r.status === 'PARTIALLY_DOCUMENTED').length;
    if (documented + partial === 0) {
        return { contextStatus: 'NOT_SUPPORTED', contextMessage: `${notFound} ${assessment}`.trim() };
    }
    if (documented === requirements.length) {
        return { contextStatus: 'SUPPORTED', contextMessage: assessment || 'All requirements are supported by the project documentation.' };
    }
    return { contextStatus: 'PARTIALLY_SUPPORTED', contextMessage: assessment || 'Some requirements are documented, others are not.' };
}
export async function parseResponse(text, search) {
    const data = readJson(text);
    if (data.needsClarification === true) {
        const question = typeof data.clarificationQuestion === 'string' ? data.clarificationQuestion.trim() : '';
        if (!question)
            throw invalid();
        return { status: 'needs_clarification', question };
    }
    const task = plainToInstance(GeneratedTaskDto, data.task);
    if (!data.task || typeof data.task !== 'object' || (await validate(task, { forbidUnknownValues: true })).length > 0)
        throw invalid();
    const analysis = plainToInstance(GeneratedAnalysisDto, {
        requirements: data.requirements ?? [],
        suggestions: data.suggestions ?? [],
        contextAssessment: data.contextAssessment ?? '',
    });
    if ((await validate(analysis, { forbidUnknownValues: true })).length > 0)
        throw invalid();
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
//# sourceMappingURL=ai.result.js.map