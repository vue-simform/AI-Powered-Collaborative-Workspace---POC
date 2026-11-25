import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateTaskDto, UpdateStatusDto } from './task.dto.js';
import { TaskService } from './task.service.js';

// No prefix here because the routes below start with different paths (projects/... and tasks/...).
@Controller()
// All task routes require a logged-in user.
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly tasks: TaskService) {}

  // GET /api/projects/:projectId/tasks: list a project's tasks.
  @Get('projects/:projectId/tasks')
  findByProject(@Param('projectId') projectId: string) {
    return this.tasks.findByProject(projectId);
  }

  // POST /api/projects/:projectId/tasks: add a task to a project.
  @Post('projects/:projectId/tasks')
  create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.tasks.create(projectId, dto);
  }

  // PATCH /api/tasks/:taskId/status: change only a task's status (e.g. move it on the board).
  @Patch('tasks/:taskId/status')
  updateStatus(@Param('taskId') taskId: string, @Body() dto: UpdateStatusDto) {
    return this.tasks.updateStatus(taskId, dto.status);
  }
}
