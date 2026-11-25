import { UserService } from './user.service.js';
export declare class UserController {
    private readonly users;
    constructor(users: UserService);
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        name: string;
        email: string;
        id: string;
    }[]>;
}
