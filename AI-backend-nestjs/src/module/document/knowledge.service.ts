import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma.service.js';
import type { Chunk } from './document-text.js';
import { EmbeddingService } from './embedding.service.js';

// One search result: a chunk of a document and how well it matches (1 = identical).
export type KnowledgeChunk = {
  chunkId: string;
  content: string;
  documentName: string;
  pageNumber: number | null;
  section: string | null;
  score: number;
};

// What a search returns: the best matching chunks (empty if the project has no finished documents or nothing matches).
export type KnowledgeResult = { chunks: KnowledgeChunk[] };

// The project's knowledge base: stores a document's chunks (with their numbers) and searches them.
@Injectable()
export class KnowledgeService {
  // Injected: the text-to-numbers service, config (.env) and the database.
  constructor(
    private readonly embeddings: EmbeddingService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ---------- 1. Save a document's chunks ----------

  // Replaces the stored chunks of one document with these (text, source and numbers).
  // Prisma cannot write the vector column, so the insert is raw SQL.
  async saveChunks(doc: { id: string; projectId: string }, chunks: Chunk[]) {
    // Step 1: embed all chunks. Step 2: build one SQL row per chunk (the vector is written as text like '[0.1,0.2,...]').
    const vectors = await this.embeddings.embed(chunks.map((c) => c.content), 'document');
    const rows = chunks.map(
      (c, i) =>
        Prisma.sql`(${randomUUID()}, ${doc.projectId}, ${doc.id}, ${i}, ${c.content}, ${c.pageNumber}, ${c.section}, ${`[${vectors[i].join(',')}]`}::vector)`,
    );
    // Step 3: in one transaction (all-or-nothing) delete the old chunks and insert the new ones.
    await this.prisma.$transaction([
      this.prisma.documentChunk.deleteMany({ where: { documentId: doc.id } }),
      this.prisma.$executeRaw`INSERT INTO "DocumentChunk" ("id", "projectId", "documentId", "chunkIndex", "content", "pageNumber", "section", "embedding") VALUES ${Prisma.join(rows)}`,
    ]);
  }

  // ---------- 2. Search ----------

  // Finds the chunks of THIS project that best match the question.
  // The query below requires the chunk and its document to belong to `projectId`,
  // so one project can never see another project's documents.
  async search(projectId: string, question: string): Promise<KnowledgeResult> {
    // Step 1: turn the question into numbers, the same way the chunks were turned into numbers.
    const [vector] = await this.embeddings.embed([question.slice(0, 2000)], 'query');
    const numbers = `[${vector.join(',')}]`;

    // Step 2: ask Postgres (pgvector) for the closest chunks. '<=>' is cosine distance (0 = identical),
    // so '1 - distance' is a score where 1 is a perfect match. At most RAG_TOP_K (default 6) chunks come back.
    const topK = Number(this.config.get('RAG_TOP_K') ?? 6);
    const rows = await this.prisma.$queryRaw<KnowledgeChunk[]>(Prisma.sql`
      SELECT c."id" AS "chunkId", c."content", d."fileName" AS "documentName", c."pageNumber", c."section",
             1 - (c."embedding" <=> ${numbers}::vector) AS "score"
      FROM "DocumentChunk" c
      JOIN "ProjectDocument" d ON d."id" = c."documentId"
      WHERE c."projectId" = ${projectId} AND d."projectId" = ${projectId} AND d."status" = 'PROCESSED' AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" <=> ${numbers}::vector
      LIMIT ${topK}
    `);

    // Step 3: drop weak matches (below RAG_MIN_SCORE, default 0.5). They are not real evidence.
    const minScore = Number(this.config.get('RAG_MIN_SCORE') ?? 0.5);
    const chunks = rows.map((r) => ({ ...r, score: Number(r.score) })).filter((r) => r.score >= minScore);
    return { chunks };
  }
}
