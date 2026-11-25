import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// Auth feature module: groups login/registration code and shares what other modules need.
@Module({
  imports: [
    // Set up JWT signing. 'Async' because the secret is read from config at startup, not hard-coded.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // JWT_SECRET from .env signs tokens; getOrThrow crashes the app at start if it is missing (safer than running
        // unsafe).
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Tokens expire after 7 days.
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Other modules (project, task, user) import AuthModule to reuse the guard and JWT service.
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
