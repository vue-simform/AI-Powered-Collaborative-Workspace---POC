import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service.js';
import type { Chunk } from './document-text.js';
import { EmbeddingService } from './embedding.service.js';
export type KnowledgeChunk = {
    chunkId: string;
    content: string;
    documentName: string;
    pageNumber: number | null;
    section: string | null;
    score: number;
};
export type KnowledgeResult = {
    chunks: KnowledgeChunk[];
};
export declare class KnowledgeService {
    private readonly embeddings;
    private readonly config;
    private readonly prisma;
    constructor(embeddings: EmbeddingService, config: ConfigService, prisma: PrismaService);
    saveChunks(doc: {
        id: string;
        projectId: string;
    }, chunks: Chunk[]): Promise<void>;
    search(projectId: string, question: string): Promise<KnowledgeResult>;
}
