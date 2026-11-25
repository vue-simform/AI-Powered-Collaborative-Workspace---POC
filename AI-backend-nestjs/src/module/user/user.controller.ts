import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UserService } from './user.service.js';

// Routes under /api/users.
@Controller('users')
// Only logged-in users can list users.
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  // GET /api/users: list users (used for the assignee dropdown).
  @Get()
  findAll() {
    return this.users.findAll();
  }
}
