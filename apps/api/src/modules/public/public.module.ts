import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { PublicPagesController } from './public-pages.controller';
import { PublicPagesService } from './public-pages.service';

/**
 * PublicModule — endpoints públicos sin autenticación.
 *
 * Importa TenantModule para acceder a TenantResolverService.
 * PrismaModule es global, no necesita importarse explícitamente.
 */
@Module({
  imports: [TenantModule],
  controllers: [PublicPagesController],
  providers: [PublicPagesService],
})
export class PublicModule {}
