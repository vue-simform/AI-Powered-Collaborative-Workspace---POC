var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Priority, TaskStatus } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
export class CreateTaskDto {
    title;
    description;
    priority;
    estimatedEffort;
    status;
    assigneeId;
    acceptanceCriteria;
    subtasks;
    technicalConsiderations;
}
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(120),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    IsEnum(Priority),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "priority", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(1000),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "estimatedEffort", void 0);
__decorate([
    IsOptional(),
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "assigneeId", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(15),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "acceptanceCriteria", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(15),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "subtasks", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMaxSize(15),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], CreateTaskDto.prototype, "technicalConsiderations", void 0);
export class UpdateStatusDto {
    status;
}
__decorate([
    IsEnum(TaskStatus),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
//# sourceMappingURL=task.dto.js.map