import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { CreateProjectDto } from './project.dto.js';

// Business logic for projects.
@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  // Return all projects, oldest first.
  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  }

  // Create a project; trim spaces and default the description to an empty string.
  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { name: dto.name.trim(), description: dto.description?.trim() ?? '' },
    });
  }

  // Get one project by id, or throw 404 so callers know it does not exist.
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
