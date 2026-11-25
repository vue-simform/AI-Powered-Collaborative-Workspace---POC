var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service.js';
const publicUser = { id: true, name: true, email: true };
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async register(dto) {
        const email = dto.email.toLowerCase();
        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new ConflictException('Email is already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        try {
            return await this.prisma.user.create({
                data: { name: dto.name.trim(), email, passwordHash },
                select: publicUser,
            });
        }
        catch (e) {
            if (e.code === 'P2002') {
                throw new ConflictException('Email is already registered');
            }
            throw e;
        }
    }
    async validateLogin(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
        const ok = user && (await bcrypt.compare(dto.password, user.passwordHash));
        if (!user || !ok)
            throw new UnauthorizedException('Invalid email or password');
        return { id: user.id, name: user.name, email: user.email };
    }
    findById(id) {
        return this.prisma.user.findUnique({ where: { id }, select: publicUser });
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map