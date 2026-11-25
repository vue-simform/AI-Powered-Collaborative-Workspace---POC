import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
export declare class AuthController {
    private readonly auth;
    private readonly jwt;
    constructor(auth: AuthService, jwt: JwtService);
    register(dto: RegisterDto): Promise<{
        message: string;
        user: {
            name: string;
            email: string;
            id: string;
        };
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    me(req: Request & {
        user: unknown;
    }): {
        user: unknown;
    };
    logout(res: Response): {
        message: string;
    };
}
