var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
let ProjectService = class ProjectService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
    }
    create(dto) {
        return this.prisma.project.create({
            data: { name: dto.name.trim(), description: dto.description?.trim() ?? '' },
        });
    }
    async findOne(id) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project)
            throw new NotFoundException('Project not found');
        return project;
    }
};
ProjectService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProjectService);
export { ProjectService };
//# sourceMappingURL=project.service.js.map