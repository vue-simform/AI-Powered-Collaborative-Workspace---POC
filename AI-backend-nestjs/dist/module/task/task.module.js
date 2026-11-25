var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectModule } from '../project/project.module.js';
import { TaskController } from './task.controller.js';
import { TaskGateway } from './task.gateway.js';
import { TaskService } from './task.service.js';
let TaskModule = class TaskModule {
};
TaskModule = __decorate([
    Module({
        imports: [AuthModule, ProjectModule],
        controllers: [TaskController],
        providers: [TaskService, TaskGateway],
        exports: [TaskService],
    })
], TaskModule);
export { TaskModule };
//# sourceMappingURL=task.module.js.map