import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectModule } from '../project/project.module.js';
import { TaskController } from './task.controller.js';
import { TaskGateway } from './task.gateway.js';
import { TaskService } from './task.service.js';

// Task feature module. AuthModule gives the guard, ProjectModule gives ProjectService; the gateway handles real-time
// events.
@Module({
  imports: [AuthModule, ProjectModule],
  controllers: [TaskController],
  providers: [TaskService, TaskGateway],
  exports: [TaskService], // lets the MCP module reuse the task service
})
export class TaskModule {}
