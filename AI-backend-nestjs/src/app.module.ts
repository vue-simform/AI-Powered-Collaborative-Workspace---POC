import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './module/auth/auth.module.js';
import { PrismaModule } from './prisma.module.js';
import { AiModule } from './module/ai/ai.module.js';
import { DocumentModule } from './module/document/document.module.js';
import { McpModule } from './module/mcp/mcp.module.js';
import { ProjectModule } from './module/project/project.module.js';
import { UserModule } from './module/user/user.module.js';
import { TaskModule } from './module/task/task.module.js';

// A module groups related code. AppModule is the root: it just pulls in every feature module below.
@Module({
  // ConfigModule loads .env values (global = available everywhere); the rest are our feature modules.
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, ProjectModule, TaskModule, AiModule, UserModule, DocumentModule, McpModule],
})
// Empty on purpose: all the wiring is in the @Module decorator above.
export class AppModule {}
