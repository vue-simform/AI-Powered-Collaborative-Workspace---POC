var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
export const AUTH_COOKIE = 'token';
let JwtAuthGuard = class JwtAuthGuard {
    jwt;
    auth;
    constructor(jwt, auth) {
        this.jwt = jwt;
        this.auth = auth;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        req.user = await this.userFromToken(req.cookies?.[AUTH_COOKIE]);
        return true;
    }
    async userFromToken(token) {
        if (!token)
            throw new UnauthorizedException('Not authenticated');
        try {
            const { sub } = await this.jwt.verifyAsync(token);
            const user = await this.auth.findById(sub);
            if (!user)
                throw new Error('user not found');
            return user;
        }
        catch {
            throw new UnauthorizedException('Not authenticated');
        }
    }
};
JwtAuthGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService,
        AuthService])
], JwtAuthGuard);
export { JwtAuthGuard };
//# sourceMappingURL=jwt-auth.guard.js.map