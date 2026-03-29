import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './lib/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArtistsModule } from './modules/artists/artists.module';
import { PagesModule } from './modules/pages/pages.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { PublicModule } from './modules/public/public.module';
import { JwtAuthGuard } from './common/guards';
import { S3Module } from './lib/s3/s3.module';
import { AssetsModule } from './modules/assets/assets.module';
import { MembershipModule } from './modules/membership/membership.module';
import { AuditModule } from './modules/audit/audit.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { SmartLinksModule } from './modules/smart-links/smart-links.module';

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
    PrismaModule, // Global — PrismaService inyectable en todos los módulos
    S3Module, // Global — S3Service inyectable en todos los módulos
    MembershipModule, // Global — MembershipService inyectable en todos los módulos
    AuditModule, // Global — AuditService inyectable en todos los módulos
    HealthModule,
    AuthModule,
    TenantModule, // Resolución central de tenants (username → artistId, domain → artistId)
    PublicModule, // Endpoints públicos: GET /api/public/pages/by-username/:username
    ArtistsModule,
    PagesModule,
    BlocksModule,
    AnalyticsModule,
    BillingModule,
    AssetsModule,
    OnboardingModule,
    SmartLinksModule,
  ],
  providers: [
    {
      // Guard global: todos los endpoints requieren JWT salvo @Public()
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
