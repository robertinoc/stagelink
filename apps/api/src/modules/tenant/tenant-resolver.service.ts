import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { normalizeAndValidateUsername } from '../../common/utils/username.util';
import { ResolvedTenant } from './dto/resolved-tenant.dto';

/**
 * TenantResolverService — servicio central de resolución de tenant.
 *
 * Toda la lógica para convertir un identificador público (username o dominio)
 * en un tenant interno vive aquí. Ningún otro servicio debe hacer estas
 * queries directamente.
 *
 * Estrategias soportadas:
 * 1. Por username: /[username] → artist
 * 2. Por dominio (preparado): Host header → custom_domain → artist
 *
 * Qué hacer con www:
 *   - www.artist.com se normaliza a artist.com antes de buscar en DB
 *   - Se busca el dominio normalizado en custom_domains con status=active
 *
 * Dominios de plataforma (nunca son custom domains):
 *   - stagelink.com, app.stagelink.com, api.stagelink.com
 *   - staging.stagelink.com, preview.stagelink.com
 *   - *.vercel.app, *.railway.app
 *   - localhost, 127.0.0.1, ::1
 *   Ver: isPlatformHost()
 */
@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve un tenant a partir de un username público.
   *
   * - Normaliza el username antes de buscar
   * - Retorna null si el username es inválido o no existe
   * - Retorna null si el artista no tiene página publicada
   *   (página unpublished = tenant no visible públicamente)
   */
  async resolveByUsername(rawUsername: string): Promise<ResolvedTenant | null> {
    const username = normalizeAndValidateUsername(rawUsername);
    if (!username) {
      this.logger.debug(`Invalid username format: "${rawUsername}"`);
      return null;
    }

    const artist = await this.prisma.artist.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        page: {
          select: { isPublished: true },
        },
      },
    });

    if (!artist) {
      this.logger.debug(`No artist found for username: "${username}"`);
      return null;
    }

    if (!artist.page?.isPublished) {
      this.logger.debug(`Artist "${username}" has no published page`);
      return null;
    }

    return {
      artistId: artist.id,
      username: artist.username,
      displayName: artist.displayName,
      resolvedVia: 'username',
    };
  }

  /**
   * Resuelve un tenant a partir del Host header (custom domain).
   *
   * Preparado para uso futuro — cuando un artista conecte su propio
   * dominio, esta función lo resolverá al tenant correcto.
   *
   * Flujo:
   * 1. Verifica que el host no sea un dominio interno de la plataforma
   * 2. Normaliza (strip www, lowercase, sin puerto)
   * 3. Busca en custom_domains con status='active'
   * 4. Verifica que la página esté publicada
   *
   * @param rawHost - Valor del header Host (puede incluir puerto)
   * @returns ResolvedTenant o null si no se resuelve
   */
  async resolveByDomain(rawHost: string): Promise<ResolvedTenant | null> {
    const host = normalizeDomainHost(rawHost);
    if (!host) return null;

    if (isPlatformHost(host)) {
      this.logger.debug(`Host "${host}" is a platform domain — skipping custom domain resolution`);
      return null;
    }

    const customDomain = await this.prisma.customDomain.findFirst({
      where: {
        domain: host,
        status: 'active',
      },
      select: {
        domain: true,
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            page: {
              select: { isPublished: true },
            },
          },
        },
      },
    });

    if (!customDomain) {
      this.logger.debug(`No active custom domain found for host: "${host}"`);
      return null;
    }

    const { artist } = customDomain;

    if (!artist.page?.isPublished) {
      this.logger.debug(`Artist for domain "${host}" has no published page`);
      return null;
    }

    return {
      artistId: artist.id,
      username: artist.username,
      displayName: artist.displayName,
      resolvedVia: 'custom_domain',
    };
  }
}

// =============================================================
// Helpers privados del módulo
// =============================================================

/**
 * Normaliza el valor del header Host para búsqueda en DB.
 * - Strip de puerto (host:port → host)
 * - Lowercase
 * - Strip de www. prefix
 * - Sin trailing slash
 *
 * Ejemplos:
 *   www.artist.com:443  → artist.com
 *   WWW.ARTIST.COM      → artist.com
 *   artist.com/         → artist.com
 */
function normalizeDomainHost(rawHost: string): string | null {
  if (!rawHost) return null;

  // Eliminar puerto si está presente (ej: example.com:3000)
  const withoutPort = rawHost.split(':')[0];
  if (!withoutPort) return null;

  // Lowercase y trim
  const lower = withoutPort.trim().toLowerCase();

  // Strip www. prefix
  const withoutWww = lower.startsWith('www.') ? lower.slice(4) : lower;

  // Sin trailing slash ni puntos extras
  const clean = withoutWww.replace(/\/+$/, '');

  return clean || null;
}

/**
 * Determina si un host normalizado es un dominio interno de la plataforma.
 * Estos dominios NUNCA deben interpretarse como custom domains de artistas.
 *
 * Dominios de plataforma:
 * - stagelink.com y todos sus subdominios
 * - *.vercel.app (preview deploys de Vercel)
 * - *.railway.app (preview/production de Railway)
 * - localhost, 127.0.0.1, ::1 (desarrollo local)
 *
 * Nota: se espera que el host ya esté normalizado (lowercase, sin www, sin puerto).
 */
export function isPlatformHost(host: string): boolean {
  const PLATFORM_DOMAINS = ['stagelink.com', 'localhost', '127.0.0.1', '::1'];

  const PLATFORM_SUFFIXES = [
    '.stagelink.com', // app.stagelink.com, api.stagelink.com, staging.stagelink.com, etc.
    '.vercel.app', // preview deploys: stagelink-git-feat-xxx.vercel.app
    '.railway.app', // Railway service domains
  ];

  if (PLATFORM_DOMAINS.includes(host)) return true;
  if (PLATFORM_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;

  return false;
}
