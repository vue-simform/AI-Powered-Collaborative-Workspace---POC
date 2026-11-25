import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';

// Which user columns are safe to return. passwordHash is deliberately left out.
const publicUser = { id: true, name: true, email: true } as const;

// Service = class holding business logic, kept separate from the HTTP layer in the controller.
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a new user account.
  async register(dto: RegisterDto) {
    // Lowercase so 'A@x.com' and 'a@x.com' count as the same account.
    const email = dto.email.toLowerCase();
    // Friendly early check: is this email already taken? If so, 409 Conflict.
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email is already registered');
    }
    // bcrypt hash = one-way scrambling of the password (10 = work factor). We never store the real password.
    const passwordHash = await bcrypt.hash(dto.password, 10);
    // Create the user, returning only the safe fields.
    try {
      return await this.prisma.user.create({
        data: { name: dto.name.trim(), email, passwordHash },
        select: publicUser,
      });
    } catch (e) {
      // lost a race with a concurrent registration of the same email
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw e;
    }
  }

  // Checks email + password. Returns the user or throws 401.
  async validateLogin(dto: LoginDto) {
    // Look up the user by email (lowercased as on register).
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    // bcrypt.compare hashes the typed password and compares it to the stored hash.
    const ok = user && (await bcrypt.compare(dto.password, user.passwordHash));
    // Same message for 'no such user' and 'wrong password' so attackers cannot tell which emails exist.
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');
    return { id: user.id, name: user.name, email: user.email };
  }

  // Used by the JWT guard to load the user behind a token.
  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: publicUser });
  }
}
