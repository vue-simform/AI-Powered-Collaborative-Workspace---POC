var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateTaskDto, UpdateStatusDto } from './task.dto.js';
import { TaskService } from './task.service.js';
let TaskController = class TaskController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    findByProject(projectId) {
        return this.tasks.findByProject(projectId);
    }
    create(projectId, dto) {
        return this.tasks.create(projectId, dto);
    }
    updateStatus(taskId, dto) {
        return this.tasks.updateStatus(taskId, dto.status);
    }
};
__decorate([
    Get('projects/:projectId/tasks'),
    __param(0, Param('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "findByProject", null);
__decorate([
    Post('projects/:projectId/tasks'),
    __param(0, Param('projectId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateTaskDto]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "create", null);
__decorate([
    Patch('tasks/:taskId/status'),
    __param(0, Param('taskId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateStatusDto]),
    __metadata("design:returntype", void 0)
], TaskController.prototype, "updateStatus", null);
TaskController = __decorate([
    Controller(),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [TaskService])
], TaskController);
export { TaskController };
//# sourceMappingURL=task.controller.js.map