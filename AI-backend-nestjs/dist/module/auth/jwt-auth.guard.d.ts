import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
export declare const AUTH_COOKIE = "token";
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwt;
    private readonly auth;
    constructor(jwt: JwtService, auth: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    userFromToken(token: string | undefined): Promise<{
        name: string;
        email: string;
        id: string;
    }>;
}
