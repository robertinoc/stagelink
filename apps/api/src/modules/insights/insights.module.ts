import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from '../billing/billing.module';
import { InsightsController } from './insights.controller';
import { InsightsSyncScheduler } from './insights.scheduler';
import { InsightsService } from './insights.service';
import { SoundCloudInsightsProvider } from './providers/soundcloud-insights.provider';
import { SpotifyInsightsProvider } from './providers/spotify-insights.provider';
import { YouTubeInsightsProvider } from './providers/youtube-insights.provider';

@Module({
  imports: [
    BillingModule,
    // ScheduleModule enables @Cron / @Interval decorators for the scheduler.
    // forRoot() with no args uses the default task runner (in-process).
    ScheduleModule.forRoot(),
  ],
  controllers: [InsightsController],
  providers: [
    InsightsService,
    InsightsSyncScheduler,
    SpotifyInsightsProvider,
    YouTubeInsightsProvider,
    SoundCloudInsightsProvider,
  ],
  exports: [InsightsService],
})
export class InsightsModule {}
