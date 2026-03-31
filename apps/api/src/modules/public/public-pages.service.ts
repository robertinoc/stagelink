import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import { PublicPageResponseDto, PublicBlockDto } from './dto/public-page-response.dto';
import { PostHogService } from '../analytics/posthog.service';
import { ANALYTICS_EVENTS } from '@stagelink/types';

/** Known bot/crawler patterns. Intentionally conservative — false negatives
 *  (counting a bot as a visitor) are less harmful than false positives. */
const BOT_UA_RE =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slack|discord|telegram|preview|fetch|wget|curl|python|java|go-http/i;

function isBotUserAgent(ua: string | undefined): boolean {
  if (!ua) return false;
  return BOT_UA_RE.test(ua);
}

/**
 * Hashes an IP address with SHA-256 for privacy-preserving storage.
 * Enables deduplication without persisting raw PII.
 * Uses 'unknown' as fallback — all unknown IPs map to the same hash.
 */
function hashIp(ip: string | undefined): string {
  return createHash('sha256')
    .update(ip ?? 'unknown')
    .digest('hex');
}

/** Analytics context extracted from visitor request headers. */
interface VisitorCtx {
  locale?: string;
  referrer?: string;
  platform?: string;
  userAgent?: string;
  ip?: string; // Raw IP — hashed before storage, never persisted as-is
}

/**
 * PublicPagesService — carga datos públicos de una página de artista.
 *
 * Flujo de resolución:
 * 1. Delegar a TenantResolverService para obtener el artistId estable
 * 2. Usar ese artistId para cargar la página y sus bloques
 * 3. Filtrar solo bloques publicados
 * 4. Retornar solo campos públicos (sin userId, sin datos internos)
 * 5. Persistir page_view event (fire-and-forget, non-bot only)
 *
 * El filtrado siempre se hace por artistId (identificador interno
 * estable), no por username. Esto evita data leakage entre tenants
 * si un username cambia o hay inconsistencias.
 */
@Injectable()
export class PublicPagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantResolver: TenantResolverService,
    private readonly posthog: PostHogService,
  ) {}

  /**
   * Retorna la página pública de un artista resuelto por username.
   *
   * @param rawUsername  The URL username segment.
   * @param ctx          Optional analytics context from request headers.
   * @throws NotFoundException si el username no existe o el artista no tiene página.
   */
  async getPageByUsername(rawUsername: string, ctx?: VisitorCtx): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByUsername(rawUsername);

    if (!tenant) {
      throw new NotFoundException('Artist not found');
    }

    return this.loadPublicPage(tenant.artistId, ctx);
  }

  /**
   * Retorna la página pública de un artista resuelto por dominio.
   * Preparado para uso con custom domains.
   *
   * @param host - Host header normalizado (sin puerto, sin www)
   * @param ctx  - Optional analytics context from visitor request headers.
   * @throws NotFoundException si el dominio no resuelve a ningún artista.
   */
  async getPageByDomain(host: string, ctx?: VisitorCtx): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByDomain(host);

    if (!tenant) {
      throw new NotFoundException('Not found');
    }

    return this.loadPublicPage(tenant.artistId, ctx);
  }

  /**
   * Records a link_click event from the public page.
   * Called by the public link-click endpoint (browser reports click after user action).
   *
   * Fire-and-forget by design — invalid artistId or blockId silently fails
   * (FK violation caught and dropped) to avoid impacting the visitor experience.
   *
   * @param artistId   Artist UUID.
   * @param data       Click event data from the client.
   * @param ip         Raw client IP (hashed before storage).
   */
  async recordLinkClick(
    artistId: string,
    data: {
      blockId?: string;
      linkItemId: string;
      label?: string;
      isSmartLink?: boolean;
      smartLinkId?: string;
    },
    ip?: string,
  ): Promise<void> {
    // Silently swallow errors: FK violations (invalid artistId/blockId) or
    // transient DB failures must never surface to the visitor.
    await this.prisma.analyticsEvent
      .create({
        data: {
          artistId,
          eventType: 'link_click',
          blockId: data.blockId ?? null,
          ipHash: hashIp(ip),
          linkItemId: data.linkItemId,
          label: data.label ?? null,
          isSmartLink: data.isSmartLink ?? false,
          smartLinkId: data.smartLinkId ?? null,
        },
      })
      .catch(() => {
        // Fire-and-forget — recording failure is non-fatal.
      });
  }

  /**
   * Carga la página y bloques públicos de un artista por su ID interno.
   *
   * Todos los accesos a datos públicos deben pasar por aquí,
   * garantizando que el filtrado sea siempre por artistId.
   *
   * @param ctx  Optional analytics context — persists page_view and emits PostHog event.
   */
  private async loadPublicPage(artistId: string, ctx?: VisitorCtx): Promise<PublicPageResponseDto> {
    const page = await this.prisma.page.findUnique({
      where: { artistId },
      select: {
        id: true,
        artist: {
          select: {
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            seoTitle: true,
            seoDescription: true,
          },
        },
        blocks: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            type: true,
            title: true,
            position: true,
            config: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Persist page_view + emit PostHog event — both fire-and-forget.
    // Context is omitted for server-only calls (e.g. generateMetadata in Next.js,
    // de-duped via React.cache so only one request reaches this service per render).
    if (ctx && !isBotUserAgent(ctx.userAgent)) {
      // Persist to local DB — source of truth for the basic analytics dashboard.
      // Errors are silently dropped to never impact page load latency.
      void this.prisma.analyticsEvent
        .create({
          data: {
            artistId,
            eventType: 'page_view',
            ipHash: hashIp(ctx.ip),
          },
        })
        .catch(() => {
          // DB write failure must never propagate to the visitor response.
        });

      // PostHog — external analytics (T4-4 advanced dashboard, T6-4 analytics pro).
      let referrer_domain: string | undefined;
      if (ctx.referrer) {
        try {
          referrer_domain = new URL(ctx.referrer).hostname;
        } catch {
          // Malformed Referer header — skip
        }
      }

      this.posthog.capture(ANALYTICS_EVENTS.PUBLIC_PAGE_VIEWED, artistId, {
        artist_id: artistId,
        username: page.artist.username,
        environment: process.env.NODE_ENV ?? 'development',
        page_id: page.id,
        locale: ctx.locale ?? 'en',
        ...(referrer_domain && { referrer_domain }),
        ...(ctx.platform && { platform_detected: ctx.platform }),
      });
    }

    return {
      artistId,
      pageId: page.id,
      artist: {
        username: page.artist.username,
        displayName: page.artist.displayName,
        bio: page.artist.bio,
        avatarUrl: page.artist.avatarUrl,
        coverUrl: page.artist.coverUrl,
        seoTitle: page.artist.seoTitle,
        seoDescription: page.artist.seoDescription,
      },
      blocks: page.blocks.map(
        (block): PublicBlockDto => ({
          id: block.id,
          type: block.type,
          title: block.title,
          position: block.position,
          config: (block.config as Record<string, unknown>) ?? {},
        }),
      ),
    };
  }
}
