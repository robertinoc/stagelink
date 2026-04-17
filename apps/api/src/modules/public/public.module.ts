import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { SmartLinksModule } from '../smart-links/smart-links.module';
import { PublicPagesController } from './public-pages.controller';
import { PublicBlocksController } from './public-blocks.controller';
import { PublicSmartLinksController } from './public-smart-links.controller';
import { PublicEpkController } from './public-epk.controller';
import { PublicPagesService } from './public-pages.service';
import { PublicSubscribeService } from './public-subscribe.service';
import { PublicEpkService } from './public-epk.service';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';
import { BillingModule } from '../billing/billing.module';
import { MerchModule } from '../merch/merch.module';
import { ShopifyModule } from '../shopify/shopify.module';

/**
 * PublicModule — endpoints públicos sin autenticación.
 *
 * Importa TenantModule para acceder a TenantResolverService.
 * Importa SmartLinksModule para acceder a SmartLinksService.resolve().
 * PrismaModule es global, no necesita importarse explícitamente.
 */
@Module({
  imports: [TenantModule, SmartLinksModule, BillingModule, ShopifyModule, MerchModule],
  controllers: [
    PublicPagesController,
    PublicBlocksController,
    PublicSmartLinksController,
    PublicEpkController,
  ],
  providers: [PublicPagesService, PublicSubscribeService, PublicEpkService, PublicRateLimitGuard],
})
export class PublicModule {}
