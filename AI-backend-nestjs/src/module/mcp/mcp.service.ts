import { HttpException, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/server';
import { TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { ProjectService } from '../project/project.service.js';
import { TaskService } from '../task/task.service.js';

// MCP = Model Context Protocol. It is a standard way for an AI app (like Claude) to ask our backend:
// "which tools do you have?" and then "please run this tool".
// This service is the place where our tools are declared:
//   ping           - a test tool (phase 2)
//   list_projects  - all projects (phase 3)
//   list_tasks     - the tasks of one project (phase 4)
// The tools reuse the services our website already uses, so the data and the rules are the same.

// Wraps any data as the reply format MCP expects: a list of text items. We send the data as readable JSON.
const asText = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

// Marks a tool as "read only": it only looks at data and never changes it. Claude can use this to know it is safe.
const readOnly = { readOnlyHint: true };

@Injectable()
export class McpService {
  // Nest hands us the two services the tools need (projects and tasks).
  constructor(
    private readonly projects: ProjectService,
    private readonly tasks: TaskService,
  ) {}

  // Builds a brand-new MCP server that already knows all our tools.
  // The controller calls this once per request ("stateless" mode: nothing is remembered between requests).
  createServer() {
    // The name and version are shown to the AI app when it connects.
    const server = new McpServer({ name: 'ai-workspace', version: '1.0.0' });

    // registerTool(name, settings, function):
    //  - name: what Claude calls the tool.
    //  - description: tells Claude when to use the tool. This is the main thing Claude reads to choose a tool.
    //  - inputSchema: the "menu" of inputs. Zod writes it, and the SDK uses it to check the input
    //    and to describe the tool to Claude (the same job a DTO does for our website's routes).
    //  - the function: runs when Claude calls the tool, and returns text for Claude to read.

    // Phase 2: a test tool that proves the connection works.
    server.registerTool(
      'ping',
      {
        title: 'Ping',
        description: 'Checks that the MCP server is working. Returns "pong".',
        inputSchema: z.object({ name: z.string().optional().describe('Optional name to greet') }),
        annotations: readOnly,
      },
      async ({ name }) => asText(name ? `pong, ${name}` : 'pong'),
    );

    // Phase 3: lists every project. It has no input, so there is no inputSchema.
    server.registerTool(
      'list_projects',
      {
        title: 'List projects',
        description:
          'Lists all projects in the AI Workspace app (id, name, description). Call this first when you need a project id for another tool.',
        annotations: readOnly,
      },
      async () =>
        this.safely(async () => {
          const projects = await this.projects.findAll();
          // Send only the fields Claude needs, not the whole database row.
          return projects.map(({ id, name, description, createdAt }) => ({ id, name, description, createdAt }));
        }),
    );

    // Phase 4: lists the tasks of one project, and can keep only one status (for example IN_PROGRESS).
    server.registerTool(
      'list_tasks',
      {
        title: 'List tasks',
        description:
          'Lists the tasks of one project in the AI Workspace app, with status, priority, estimated hours and assignee. Use list_projects first to get the project id.',
        inputSchema: z.object({
          projectId: z.string().describe('The project id, taken from list_projects'),
          status: z.enum(TaskStatus).optional().describe('Only return tasks with this status'),
        }),
        annotations: readOnly,
      },
      async ({ projectId, status }) =>
        this.safely(async () => {
          // findByProject throws "Project not found" for an unknown id; safely() turns that into a readable answer.
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
        }),
    );

    return server;
  }

  // Runs a tool's work and wraps the result. If our services answer with a normal error (for example
  // "Project not found"), Claude gets that message as the tool's answer, with isError set, so it can explain
  // the problem or try again. Unexpected errors are not hidden: they are thrown and logged as usual.
  private async safely(work: () => Promise<unknown>) {
    try {
      return asText(await work());
    } catch (e) {
      if (e instanceof HttpException) {
        return { content: [{ type: 'text' as const, text: e.message }], isError: true };
      }
      throw e;
    }
  }
}
