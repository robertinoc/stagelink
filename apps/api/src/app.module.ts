import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from './common/guards';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './lib/prisma.module';
import { S3Module } from './lib/s3/s3.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ArtistsModule } from './modules/artists/artists.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { HealthModule } from './modules/health/health.module';
import { MembershipModule } from './modules/membership/membership.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PagesModule } from './modules/pages/pages.module';
import { PublicModule } from './modules/public/public.module';
import { EpkModule } from './modules/epk/epk.module';
import { ShopifyModule } from './modules/shopify/shopify.module';
import { SmartLinksModule } from './modules/smart-links/smart-links.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    S3Module,
    MembershipModule,
    AuditModule,
    HealthModule,
    AuthModule,
    TenantModule,
    PublicModule,
    ArtistsModule,
    PagesModule,
    BlocksModule,
    AnalyticsModule,
    BillingModule,
    AssetsModule,
    OnboardingModule,
    SmartLinksModule,
    SubscribersModule,
    EpkModule,
    ShopifyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
