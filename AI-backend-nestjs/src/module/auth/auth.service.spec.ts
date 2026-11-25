import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';

const makeService = (user: { findUnique: any; create?: any }) =>
  new AuthService({ user } as any);

describe('AuthService', () => {
  it('hashes the password and returns no hash', async () => {
    const create = vi.fn(async ({ data }) => ({ id: '1', name: data.name, email: data.email }));
    const service = makeService({ findUnique: vi.fn().mockResolvedValue(null), create });
    const user = await service.register({ name: 'A', email: 'A@x.com', password: 'Password123' });
    const stored = create.mock.calls[0][0].data;
    expect(stored.email).toBe('a@x.com');
    expect(stored.passwordHash).not.toBe('Password123');
    expect(await bcrypt.compare('Password123', stored.passwordHash)).toBe(true);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate emails', async () => {
    const service = makeService({ findUnique: vi.fn().mockResolvedValue({ id: '1' }) });
    await expect(
      service.register({ name: 'A', email: 'a@x.com', password: 'Password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unknown email and wrong password the same way', async () => {
    const passwordHash = await bcrypt.hash('Password123', 4);
    const known = makeService({ findUnique: vi.fn().mockResolvedValue({ id: '1', name: 'A', email: 'a@x.com', passwordHash }) });
    const unknown = makeService({ findUnique: vi.fn().mockResolvedValue(null) });
    await expect(known.validateLogin({ email: 'a@x.com', password: 'nope' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(unknown.validateLogin({ email: 'b@x.com', password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(known.validateLogin({ email: 'a@x.com', password: 'Password123' })).resolves.toEqual({ id: '1', name: 'A', email: 'a@x.com' });
  });
});
