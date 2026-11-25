import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GeminiModule } from '../ai/gemini.module.js';
import { ProjectModule } from '../project/project.module.js';
import { DocumentController } from './document.controller.js';
import { DocumentService } from './document.service.js';
import { EmbeddingService } from './embedding.service.js';
import { KnowledgeService } from './knowledge.service.js';

// Module = a box grouping related pieces. Here: document upload/processing, plus the knowledge (search) service.
@Module({
  imports: [AuthModule, ProjectModule, GeminiModule],
  controllers: [DocumentController],
  providers: [DocumentService, EmbeddingService, KnowledgeService],
  exports: [KnowledgeService], // used by the AI module to look things up
})
export class DocumentModule {}
