var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma.service.js';
import { EmbeddingService } from './embedding.service.js';
let KnowledgeService = class KnowledgeService {
    embeddings;
    config;
    prisma;
    constructor(embeddings, config, prisma) {
        this.embeddings = embeddings;
        this.config = config;
        this.prisma = prisma;
    }
    async saveChunks(doc, chunks) {
        const vectors = await this.embeddings.embed(chunks.map((c) => c.content), 'document');
        const rows = chunks.map((c, i) => Prisma.sql `(${randomUUID()}, ${doc.projectId}, ${doc.id}, ${i}, ${c.content}, ${c.pageNumber}, ${c.section}, ${`[${vectors[i].join(',')}]`}::vector)`);
        await this.prisma.$transaction([
            this.prisma.documentChunk.deleteMany({ where: { documentId: doc.id } }),
            this.prisma.$executeRaw `INSERT INTO "DocumentChunk" ("id", "projectId", "documentId", "chunkIndex", "content", "pageNumber", "section", "embedding") VALUES ${Prisma.join(rows)}`,
        ]);
    }
    async search(projectId, question) {
        const [vector] = await this.embeddings.embed([question.slice(0, 2000)], 'query');
        const numbers = `[${vector.join(',')}]`;
        const topK = Number(this.config.get('RAG_TOP_K') ?? 6);
        const rows = await this.prisma.$queryRaw(Prisma.sql `
      SELECT c."id" AS "chunkId", c."content", d."fileName" AS "documentName", c."pageNumber", c."section",
             1 - (c."embedding" <=> ${numbers}::vector) AS "score"
      FROM "DocumentChunk" c
      JOIN "ProjectDocument" d ON d."id" = c."documentId"
      WHERE c."projectId" = ${projectId} AND d."projectId" = ${projectId} AND d."status" = 'PROCESSED' AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" <=> ${numbers}::vector
      LIMIT ${topK}
    `);
        const minScore = Number(this.config.get('RAG_MIN_SCORE') ?? 0.5);
        const chunks = rows.map((r) => ({ ...r, score: Number(r.score) })).filter((r) => r.score >= minScore);
        return { chunks };
    }
};
KnowledgeService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EmbeddingService,
        ConfigService,
        PrismaService])
], KnowledgeService);
export { KnowledgeService };
//# sourceMappingURL=knowledge.service.js.map