import { TaskGateway } from './task.gateway.js';

function setup(opts: { valid?: boolean; projects?: string[] } = {}) {
  const guard = {
    userFromToken: vi.fn(async () => {
      if (opts.valid === false) throw new Error('Not authenticated');
      return { id: 'u1' };
    }),
  };
  const prisma = { task: { findMany: vi.fn(async () => (opts.projects ?? []).map((projectId) => ({ projectId }))) } };
  const gateway = new TaskGateway(guard as any, prisma as any);
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  const socketsJoin = vi.fn();
  const inRoom = vi.fn(() => ({ socketsJoin }));
  gateway.server = { to, in: inRoom } as any;
  return { gateway, guard, prisma, to, emit, inRoom, socketsJoin };
}

const client = (cookies: Record<string, string> = {}) =>
  ({ id: 's1', request: { cookies }, join: vi.fn(), disconnect: vi.fn() }) as any;

describe('TaskGateway', () => {
  it('puts a valid client in its user room and in the room of every project it is assigned in', async () => {
    const { gateway, guard, prisma } = setup({ projects: ['pA', 'pB'] });
    const c = client({ token: 'abc' });
    await gateway.handleConnection(c);
    expect(guard.userFromToken).toHaveBeenCalledWith('abc');
    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { assigneeId: 'u1' } }));
    expect(c.join).toHaveBeenCalledExactlyOnceWith(['user:u1', 'project:pA', 'project:pB']);
    expect(c.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects when the guard rejects the token', async () => {
    const { gateway } = setup({ valid: false });
    const c = client({ token: 'bad' });
    await gateway.handleConnection(c);
    expect(c.disconnect).toHaveBeenCalledWith(true);
    expect(c.join).not.toHaveBeenCalled();
  });

  it("broadcasts a new task only to its project's room", () => {
    const { gateway, to, emit, inRoom } = setup();
    const task = { id: 't1', projectId: 'pA', assigneeId: null } as any;
    gateway.emitCreated(task);
    expect(inRoom).not.toHaveBeenCalled();
    expect(to).toHaveBeenCalledExactlyOnceWith('project:pA');
    expect(emit).toHaveBeenCalledWith('task:created', task);
  });

  it('adds the assignee to the project room before announcing the new task', () => {
    const { gateway, inRoom, socketsJoin, to } = setup();
    gateway.emitCreated({ id: 't1', projectId: 'pA', assigneeId: 'u2' } as any);
    expect(inRoom).toHaveBeenCalledExactlyOnceWith('user:u2');
    expect(socketsJoin).toHaveBeenCalledExactlyOnceWith('project:pA');
    expect(socketsJoin.mock.invocationCallOrder[0]).toBeLessThan(to.mock.invocationCallOrder[0]);
  });

  it("broadcasts a status update only to the task's project room", () => {
    const { gateway, to, emit } = setup();
    const task = { id: 't1', projectId: 'pA' } as any;
    gateway.emitStatusUpdated(task);
    expect(to).toHaveBeenCalledExactlyOnceWith('project:pA');
    expect(emit).toHaveBeenCalledWith('task:status-updated', task);
  });
});
