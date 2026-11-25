var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { HttpException, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/server';
import { TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { ProjectService } from '../project/project.service.js';
import { TaskService } from '../task/task.service.js';
const asText = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
const readOnly = { readOnlyHint: true };
let McpService = class McpService {
    projects;
    tasks;
    constructor(projects, tasks) {
        this.projects = projects;
        this.tasks = tasks;
    }
    createServer() {
        const server = new McpServer({ name: 'ai-workspace', version: '1.0.0' });
        server.registerTool('ping', {
            title: 'Ping',
            description: 'Checks that the MCP server is working. Returns "pong".',
            inputSchema: z.object({ name: z.string().optional().describe('Optional name to greet') }),
            annotations: readOnly,
        }, async ({ name }) => asText(name ? `pong, ${name}` : 'pong'));
        server.registerTool('list_projects', {
            title: 'List projects',
            description: 'Lists all projects in the AI Workspace app (id, name, description). Call this first when you need a project id for another tool.',
            annotations: readOnly,
        }, async () => this.safely(async () => {
            const projects = await this.projects.findAll();
            return projects.map(({ id, name, description, createdAt }) => ({ id, name, description, createdAt }));
        }));
        server.registerTool('list_tasks', {
            title: 'List tasks',
            description: 'Lists the tasks of one project in the AI Workspace app, with status, priority, estimated hours and assignee. Use list_projects first to get the project id.',
            inputSchema: z.object({
                projectId: z.string().describe('The project id, taken from list_projects'),
                status: z.enum(TaskStatus).optional().describe('Only return tasks with this status'),
            }),
            annotations: readOnly,
        }, async ({ projectId, status }) => this.safely(async () => {
            const tasks = await this.tasks.findByProject(projectId);
            return tasks
                .filter((task) => !status || task.status === status)
                .map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                estimatedEffort: task.estimatedEffort,
                assignee: task.assignee?.name ?? null,
            }));
        }));
        return server;
    }
    async safely(work) {
        try {
            return asText(await work());
        }
        catch (e) {
            if (e instanceof HttpException) {
                return { content: [{ type: 'text', text: e.message }], isError: true };
            }
            throw e;
        }
    }
};
McpService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ProjectService,
        TaskService])
], McpService);
export { McpService };
//# sourceMappingURL=mcp.service.js.map