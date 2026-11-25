import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { GenerateTaskDto } from './ai.dto.js';
import { AiService } from './ai.service.js';

// Controller = the class that receives HTTP requests. Every route here starts with /ai.
@Controller('ai')
// Guard = a bouncer: requests without a valid login token (JWT) are rejected before reaching our code.
@UseGuards(JwtAuthGuard)
export class AiController {
  // Nest automatically gives us the AiService (dependency injection), so we do not create it ourselves.
  constructor(private readonly ai: AiService) {}

  // POST /ai/generate-task: the user sends a short task title and gets back an AI-written task suggestion.
  // Code 200 (not the default 201) because nothing is created in the database here.
  // @Body() is the JSON sent by the client; it is checked against GenerateTaskDto rules first.
  @Post('generate-task')
  @HttpCode(200)
  generateTask(@Body() dto: GenerateTaskDto) {
    return this.ai.generateTask(dto);
  }
}
