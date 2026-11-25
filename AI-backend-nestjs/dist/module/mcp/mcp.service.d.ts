import { McpServer } from '@modelcontextprotocol/server';
import { ProjectService } from '../project/project.service.js';
import { TaskService } from '../task/task.service.js';
export declare class McpService {
    private readonly projects;
    private readonly tasks;
    constructor(projects: ProjectService, tasks: TaskService);
    createServer(): McpServer;
    private safely;
}
