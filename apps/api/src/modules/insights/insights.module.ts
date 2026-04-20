import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { SoundCloudInsightsProvider } from './providers/soundcloud-insights.provider';
import { SpotifyInsightsProvider } from './providers/spotify-insights.provider';
import { YouTubeInsightsProvider } from './providers/youtube-insights.provider';

@Module({
  imports: [BillingModule],
  controllers: [InsightsController],
  providers: [
    InsightsService,
    SpotifyInsightsProvider,
    YouTubeInsightsProvider,
    SoundCloudInsightsProvider,
  ],
  exports: [InsightsService],
})
export class InsightsModule {}
