import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DocumentModule } from '../document/document.module.js';
import { ProjectModule } from '../project/project.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { GeminiModule } from './gemini.module.js';

// Module = a box that groups related controllers and services. 'imports' are other boxes whose services we use.
// This box wires up the AI feature: one controller (the routes) and one service (the logic).
@Module({
  imports: [AuthModule, ProjectModule, GeminiModule, DocumentModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
