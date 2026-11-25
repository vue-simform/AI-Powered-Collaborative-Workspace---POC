import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const tasks = [
  { title: 'Set up project repository', description: 'Create the repos and CI basics.', status: 'COMPLETED', priority: 'HIGH', estimatedEffort: 4 },
  { title: 'Design database schema', description: 'Define users, projects and tasks.', status: 'COMPLETED', priority: 'MEDIUM', estimatedEffort: 6 },
  { title: 'Build login and registration', description: 'Cookie-based JWT authentication.', status: 'IN_PROGRESS', priority: 'HIGH', estimatedEffort: 8 },
  { title: 'Create Kanban board UI', description: 'Four status columns with task cards.', status: 'IN_PROGRESS', priority: 'MEDIUM', estimatedEffort: 10 },
  { title: 'Write API documentation', description: 'Document the REST endpoints.', status: 'TODO', priority: 'LOW', estimatedEffort: 3 },
  { title: 'Set up staging environment', description: 'Waiting for infrastructure access.', status: 'BLOCKED', priority: 'MEDIUM', estimatedEffort: 5 },
] as const;

const project = await prisma.project.upsert({
  where: { id: 'demo-project' },
  update: {},
  create: {
    id: 'demo-project',
    name: 'Website Redesign',
    description: 'Demo project for the AI-powered collaborative workspace POC.',
  },
});

if ((await prisma.task.count({ where: { projectId: project.id } })) === 0) {
  await prisma.task.createMany({ data: tasks.map((t) => ({ ...t, projectId: project.id })) });
}

console.log('Seeded demo project:', project.id);
await prisma.$disconnect();
