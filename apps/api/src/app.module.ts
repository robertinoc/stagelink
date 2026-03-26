import { Module } from '@nestjs/common';
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
    HealthModule,
    AuthModule,
    TenantModule, // Resolución central de tenants (username → artistId, domain → artistId)
    PublicModule, // Endpoints públicos: GET /api/public/pages/by-username/:username
    ArtistsModule,
    PagesModule,
    BlocksModule,
    AnalyticsModule,
    BillingModule,
  ],
})
export class AppModule {}
