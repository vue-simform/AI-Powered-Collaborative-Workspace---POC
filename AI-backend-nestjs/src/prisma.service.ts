import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Injectable = Nest can create this class and hand it to other classes that ask for it (dependency injection).
@Injectable()
// Our single database client. Extending PrismaClient gives us this.user, this.task, etc. for queries.
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Connect Prisma to PostgreSQL using the DATABASE_URL from the environment.
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  // Nest calls this when the app starts: open the database connection.
  async onModuleInit() {
    await this.$connect();
  }

  // Nest calls this when the app shuts down: close the database connection cleanly.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
