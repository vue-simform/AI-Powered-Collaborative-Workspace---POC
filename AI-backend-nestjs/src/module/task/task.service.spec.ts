import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service.js';

const dto = { title: '  Write docs ', priority: 'LOW', estimatedEffort: 2 } as const;

function setup(opts: { project?: boolean; task?: boolean; user?: boolean } = {}) {
  const prisma = {
    user: { findUnique: vi.fn().mockResolvedValue(opts.user === false ? null : { id: 'u2' }) },
    task: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(opts.task === false ? null : { id: 't1' }),
      create: vi.fn(async ({ data }) => ({ id: 't1', ...data })),
      update: vi.fn(async ({ data }) => ({ id: 't1', ...data })),
    },
  };
  const projects = {
    findOne: vi.fn(async () => {
      if (opts.project === false) throw new NotFoundException('Project not found');
      return { id: 'p1' };
    }),
  };
  const gateway = { emitCreated: vi.fn(), emitStatusUpdated: vi.fn() };
  return { prisma, projects, gateway, service: new TaskService(prisma as any, projects as any, gateway as any) };
}

describe('TaskService', () => {
  it('creates a task in the given project with a trimmed title', async () => {
    const { service, prisma } = setup();
    await service.create('p1', dto);
    expect(prisma.task.create.mock.calls[0][0].data).toMatchObject({ title: 'Write docs', projectId: 'p1' });
  });

  it('saves acceptance criteria, subtasks and technical considerations', async () => {
    const { service, prisma } = setup();
    await service.create('p1', { ...dto, acceptanceCriteria: ['A'], subtasks: ['B'], technicalConsiderations: ['C'] });
    expect(prisma.task.create.mock.calls[0][0].data).toMatchObject({
      acceptanceCriteria: ['A'],
      subtasks: ['B'],
      technicalConsiderations: ['C'],
    });
  });

  it('rejects create and list for a missing project', async () => {
    const { service } = setup({ project: false });
    await expect(service.create('nope', dto)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findByProject('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates the status of an existing task', async () => {
    const { service, prisma } = setup();
    await service.updateStatus('t1', 'BLOCKED');
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't1' }, data: { status: 'BLOCKED' } }),
    );
  });

  it('rejects a status update for a missing task', async () => {
    const { service } = setup({ task: false });
    await expect(service.updateStatus('nope', 'TODO')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('broadcasts the saved task after create and after a status update', async () => {
    const { service, gateway } = setup();
    const created = await service.create('p1', dto);
    expect(gateway.emitCreated).toHaveBeenCalledExactlyOnceWith(created);
    const updated = await service.updateStatus('t1', 'BLOCKED');
    expect(gateway.emitStatusUpdated).toHaveBeenCalledExactlyOnceWith(updated);
  });

  it('does not broadcast when the project or task is missing or the save fails', async () => {
    const missing = setup({ project: false });
    await missing.service.create('nope', dto).catch(() => undefined);
    const noTask = setup({ task: false });
    await noTask.service.updateStatus('nope', 'TODO').catch(() => undefined);
    const failing = setup();
    failing.prisma.task.create.mockRejectedValueOnce(new Error('db down'));
    failing.prisma.task.update.mockRejectedValueOnce(new Error('db down'));
    await failing.service.create('p1', dto).catch(() => undefined);
    await failing.service.updateStatus('t1', 'TODO').catch(() => undefined);
    for (const { gateway } of [missing, noTask, failing]) {
      expect(gateway.emitCreated).not.toHaveBeenCalled();
      expect(gateway.emitStatusUpdated).not.toHaveBeenCalled();
    }
  });

  it('saves the assignee and includes it in the response query', async () => {
    const { service, prisma } = setup();
    await service.create('p1', { ...dto, assigneeId: 'u2' });
    expect(prisma.task.create.mock.calls[0][0].data).toMatchObject({ assigneeId: 'u2' });
    expect(prisma.task.create.mock.calls[0][0].include).toHaveProperty('assignee');
  });

  it('leaves the task unassigned when no assignee is given', async () => {
    const { service, prisma } = setup();
    await service.create('p1', dto);
    expect(prisma.task.create.mock.calls[0][0].data).toMatchObject({ assigneeId: null });
  });

  it('rejects an assignee that does not exist and does not broadcast', async () => {
    const { service, prisma, gateway } = setup({ user: false });
    await expect(service.create('p1', { ...dto, assigneeId: 'ghost' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(gateway.emitCreated).not.toHaveBeenCalled();
  });
});
