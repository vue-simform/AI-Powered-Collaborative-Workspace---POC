import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateProjectDto } from './project.dto.js';
import { ProjectService } from './project.service.js';

// Routes under /api/projects.
@Controller('projects')
// Guard applied to the whole class: every route here needs a logged-in user.
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  // GET /api/projects: list all projects.
  @Get()
  findAll() {
    return this.projects.findAll();
  }

  // POST /api/projects: create a project from the validated body.
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  // GET /api/projects/:projectId: fetch one project. ':projectId' is a URL parameter.
  @Get(':projectId')
  findOne(@Param('projectId') projectId: string) {
    return this.projects.findOne(projectId);
  }
}
