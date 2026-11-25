import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';

// Business logic for users.
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Everyone can be assigned a task, so the picker lists all users (never the password hash).
  findAll() {
    return this.prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } });
  }
}
