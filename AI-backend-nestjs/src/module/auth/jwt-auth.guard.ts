import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

// Name of the cookie that holds the JWT.
export const AUTH_COOKIE = 'token';

// A guard decides whether a request may reach a route. This one requires a valid login cookie.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  // Nest calls this before the route runs. Returning true lets the request through; throwing blocks it with 401.
  async canActivate(context: ExecutionContext) {
    // Get the underlying Express request.
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    // Attach the logged-in user to the request so controllers can read req.user.
    req.user = await this.userFromToken(req.cookies?.[AUTH_COOKIE] as string | undefined);
    return true;
  }

  // Shared with the socket gateway so HTTP and WebSocket use the same check.
  // Turns a JWT string into a user. Used by HTTP and WebSocket code.
  async userFromToken(token: string | undefined) {
    // No cookie means not logged in.
    if (!token) throw new UnauthorizedException('Not authenticated');
    try {
      // Verify the signature and expiry; 'sub' is the user id we stored at login.
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(token);
      // Make sure the user still exists (an old token for a deleted user is useless).
      const user = await this.auth.findById(sub);
      if (!user) throw new Error('user not found');
      return user;
    // Any failure (bad, expired token, missing user) becomes the same generic 401.
    } catch {
      throw new UnauthorizedException('Not authenticated');
    }
  }
}
