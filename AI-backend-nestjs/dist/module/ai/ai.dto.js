var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Priority } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
export class GenerateTaskDto {
    title;
    projectId;
    description;
    additionalInstructions;
}
__decorate([
    IsString(),
    MinLength(3),
    MaxLength(200),
    __metadata("design:type", String)
], GenerateTaskDto.prototype, "title", void 0);
__decorate([
    IsString(),
    MinLength(1),
    __metadata("design:type", String)
], GenerateTaskDto.prototype, "projectId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], GenerateTaskDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], GenerateTaskDto.prototype, "additionalInstructions", void 0);
export const REQUIREMENT_STATUSES = ['DOCUMENTED', 'PARTIALLY_DOCUMENTED', 'NOT_DOCUMENTED'];
export class RequirementDto {
    text;
    status;
    sourceChunkIds;
}
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(300),
    __metadata("design:type", String)
], RequirementDto.prototype, "text", void 0);
__decorate([
    IsEnum(REQUIREMENT_STATUSES),
    __metadata("design:type", String)
], RequirementDto.prototype, "status", void 0);
__decorate([
    IsArray(),
    ArrayMaxSize(5),
    IsString({ each: true }),
    __metadata("design:type", Array)
], RequirementDto.prototype, "sourceChunkIds", void 0);
export class GeneratedAnalysisDto {
    requirements;
    suggestions;
    contextAssessment;
}
__decorate([
    IsArray(),
    ArrayMaxSize(30),
    ValidateNested({ each: true }),
    Type(() => RequirementDto),
    __metadata("design:type", Array)
], GeneratedAnalysisDto.prototype, "requirements", void 0);
__decorate([
    IsArray(),
    ArrayMaxSize(10),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], GeneratedAnalysisDto.prototype, "suggestions", void 0);
__decorate([
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], GeneratedAnalysisDto.prototype, "contextAssessment", void 0);
export class GeneratedTaskDto {
    title;
    description;
    priority;
    estimatedEffort;
    acceptanceCriteria;
    subtasks;
    technicalConsiderations;
}
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(200),
    __metadata("design:type", String)
], GeneratedTaskDto.prototype, "title", void 0);
__decorate([
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], GeneratedTaskDto.prototype, "description", void 0);
__decorate([
    IsEnum(Priority),
    __metadata("design:type", String)
], GeneratedTaskDto.prototype, "priority", void 0);
__decorate([
    IsInt(),
    Min(1),
    Max(1000),
    __metadata("design:type", Number)
], GeneratedTaskDto.prototype, "estimatedEffort", void 0);
__decorate([
    IsArray(),
    ArrayMaxSize(15),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], GeneratedTaskDto.prototype, "acceptanceCriteria", void 0);
__decorate([
    IsArray(),
    ArrayMaxSize(15),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], GeneratedTaskDto.prototype, "subtasks", void 0);
__decorate([
    IsArray(),
    ArrayMaxSize(15),
    IsString({ each: true }),
    MaxLength(300, { each: true }),
    __metadata("design:type", Array)
], GeneratedTaskDto.prototype, "technicalConsiderations", void 0);
//# sourceMappingURL=ai.dto.js.map