import { PrismaService } from '../../prisma.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    register(dto: RegisterDto): Promise<{
        name: string;
        email: string;
        id: string;
    }>;
    validateLogin(dto: LoginDto): Promise<{
        id: string;
        name: string;
        email: string;
    }>;
    findById(id: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        name: string;
        email: string;
        id: string;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
