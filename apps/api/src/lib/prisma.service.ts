import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService wraps PrismaClient for NestJS dependency injection.
 *
 * We do NOT call $connect() in onModuleInit — Prisma connects lazily on
 * the first query. Eagerly connecting at startup would crash the server
 * if the database isn't immediately reachable (e.g. Railway cold start),
 * which would prevent even the /api/health endpoint from responding.
 *
 * $disconnect() is still called on shutdown for clean connection teardown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
