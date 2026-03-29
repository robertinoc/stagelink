import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { SmartLinksModule } from '../smart-links/smart-links.module';
import { PublicPagesController } from './public-pages.controller';
import { PublicBlocksController } from './public-blocks.controller';
import { PublicSmartLinksController } from './public-smart-links.controller';
import { PublicPagesService } from './public-pages.service';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';

/**
 * PublicModule — endpoints públicos sin autenticación.
 *
 * Importa TenantModule para acceder a TenantResolverService.
 * Importa SmartLinksModule para acceder a SmartLinksService.resolve().
 * PrismaModule es global, no necesita importarse explícitamente.
 */
@Module({
  imports: [TenantModule, SmartLinksModule],
  controllers: [PublicPagesController, PublicBlocksController, PublicSmartLinksController],
  providers: [PublicPagesService, PublicRateLimitGuard],
})
export class PublicModule {}
