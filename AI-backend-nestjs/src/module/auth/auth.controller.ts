import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { AUTH_COOKIE, JwtAuthGuard } from './jwt-auth.guard.js';

// How long the login cookie lives: 7 days in milliseconds (matches the JWT expiry).
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Cookie settings used for both setting and clearing the cookie (they must match or the browser keeps it).
const cookieOptions = (): CookieOptions => ({
  // httpOnly: JavaScript in the page cannot read the cookie, which protects the token from XSS attacks.
  httpOnly: true,
  // secure: send the cookie only over HTTPS in production.
  secure: process.env.NODE_ENV === 'production',
  // sameSite lax: browser does not send it on most cross-site requests (helps against CSRF).
  sameSite: 'lax',
  path: '/',
});

// Controller = class that receives HTTP requests. Routes here start with /api/auth.
@Controller('auth')
export class AuthController {
  // AuthService does the real work; JwtService creates the signed login token (JWT).
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  // POST /api/auth/register: create a new account.
  @Post('register')
  // The DTO (Data Transfer Object) is the validated shape of the request body.
  async register(@Body() dto: RegisterDto) {
    // Service saves the user (the password gets hashed there); we never return the password.
    const user = await this.auth.register(dto);
    return { message: 'Registration successful', user };
  }

  // POST /api/auth/login: check email and password, then log the user in with a cookie.
  @Post('login')
  // POST normally answers 201 (created); login is not creating anything, so answer 200.
  @HttpCode(200)
  // passthrough lets us set the cookie on the response and still just return data.
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    // Throws 401 if email or password is wrong.
    const user = await this.auth.validateLogin(dto);
    // JWT = a signed string proving who you are. 'sub' (subject) holds the user id.
    const token = await this.jwt.signAsync({ sub: user.id });
    // Store the JWT in an httpOnly cookie so the browser sends it automatically on later requests.
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: MAX_AGE_MS });
    return { user };
  }

  // GET /api/auth/me: returns the currently logged-in user (lets the frontend check its session).
  @Get('me')
  // Guard = a bouncer that runs before the route; JwtAuthGuard rejects requests without a valid login cookie.
  @UseGuards(JwtAuthGuard)
  // req.user was filled in by the guard.
  me(@Req() req: Request & { user: unknown }) {
    return { user: req.user };
  }

  // POST /api/auth/logout: log out by deleting the cookie.
  @Post('logout')
  @HttpCode(200)
  // Browsers only delete a cookie if the clear call uses the same options as when it was set.
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, cookieOptions());
    return { message: 'Logged out' };
  }
}
