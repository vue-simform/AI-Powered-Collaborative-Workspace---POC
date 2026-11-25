import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module.js';
import { TaskModule } from '../task/task.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';

// MCP feature module: the door (controller) and the list of tools (service).
// It imports ProjectModule and TaskModule so the tools can reuse ProjectService and TaskService.
// Later phases will also import DocumentModule for the document search tool.
@Module({
  imports: [ProjectModule, TaskModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
