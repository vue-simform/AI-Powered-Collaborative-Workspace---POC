import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Global module: any other module can use PrismaService without importing PrismaModule again.
@Global()
// Module that provides the database service and shares (exports) it with the rest of the app.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
