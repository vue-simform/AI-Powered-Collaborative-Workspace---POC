import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectController } from './project.controller.js';
import { ProjectService } from './project.service.js';

// Project feature module. Imports AuthModule to get the JwtAuthGuard; exports the service so TaskModule can reuse it.
@Module({
  imports: [AuthModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
