import { Module } from '@nestjs/common';
import { TenantResolverService } from './tenant-resolver.service';

/**
 * TenantModule — resolución central de tenants.
 *
 * Exporta TenantResolverService para que otros módulos
 * (PublicModule, futuras guards) puedan resolver tenants
 * sin duplicar lógica.
 */
@Module({
  providers: [TenantResolverService],
  exports: [TenantResolverService],
})
export class TenantModule {}
