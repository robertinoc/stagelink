import { Global, Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PostHogService } from './posthog.service';

/**
 * AnalyticsModule — global so PostHogService is injectable everywhere
 * without needing to import this module explicitly in each feature module.
 *
 * PostHogService is fire-and-forget and stateless from the caller's
 * perspective — making it global keeps the DI graph clean.
 *
 * AnalyticsService queries the local analytics_events table (Prisma).
 * PrismaService is injected globally via PrismaModule.
 */
@Global()
@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PostHogService],
  exports: [AnalyticsService, PostHogService],
})
export class AnalyticsModule {}
