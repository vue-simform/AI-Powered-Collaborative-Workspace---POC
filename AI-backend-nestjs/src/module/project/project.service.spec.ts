import { NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service.js';

function setup(found: unknown = { id: 'p1' }) {
  const prisma = {
    project: {
      create: vi.fn(async ({ data }) => ({ id: 'p1', ...data })),
      findUnique: vi.fn().mockResolvedValue(found),
    },
  };
  return { prisma, service: new ProjectService(prisma as any) };
}

describe('ProjectService', () => {
  it('creates a project with a trimmed name and a default empty description', async () => {
    const { service, prisma } = setup();
    await service.create({ name: '  Roadmap ' });
    expect(prisma.project.create).toHaveBeenCalledWith({ data: { name: 'Roadmap', description: '' } });
  });

  it('rejects an unknown project', async () => {
    const { service } = setup(null);
    await expect(service.findOne('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
