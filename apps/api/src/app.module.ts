import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ArtistsModule } from './modules/artists/artists.module';
import { PagesModule } from './modules/pages/pages.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    ArtistsModule,
    PagesModule,
    BlocksModule,
    AnalyticsModule,
    BillingModule,
  ],
})
export class AppModule {}
