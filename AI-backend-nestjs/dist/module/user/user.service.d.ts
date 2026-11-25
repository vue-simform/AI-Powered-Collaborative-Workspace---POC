import { PrismaService } from '../../prisma.service.js';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        name: string;
        email: string;
        id: string;
    }[]>;
}
