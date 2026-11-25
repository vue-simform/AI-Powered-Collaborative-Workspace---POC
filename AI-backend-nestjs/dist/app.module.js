var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, ProjectModule, TaskModule, AiModule, UserModule, DocumentModule, McpModule],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map