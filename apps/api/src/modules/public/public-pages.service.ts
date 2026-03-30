import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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
 * PublicPagesService — carga datos públicos de una página de artista.
 *
 * Flujo de resolución:
 * 1. Delegar a TenantResolverService para obtener el artistId estable
 * 2. Usar ese artistId para cargar la página y sus bloques
 * 3. Filtrar solo bloques visibles (isVisible=true)
 * 4. Retornar solo campos públicos (sin userId, sin datos internos)
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
   * @throws NotFoundException si el username no existe, no está publicado
   *         o el artista no tiene página
   */
  async getPageByUsername(
    rawUsername: string,
    ctx?: { locale?: string; referrer?: string; platform?: string; userAgent?: string },
  ): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByUsername(rawUsername);

    if (!tenant) {
      // Mensaje genérico — no reflejar input del usuario en la respuesta.
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
   * @throws NotFoundException si el dominio no resuelve a ningún artista
   */
  async getPageByDomain(
    host: string,
    ctx?: { locale?: string; referrer?: string; platform?: string; userAgent?: string },
  ): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByDomain(host);

    if (!tenant) {
      // Mensaje genérico — no reflejar el Host header en la respuesta.
      throw new NotFoundException('Not found');
    }

    return this.loadPublicPage(tenant.artistId, ctx);
  }

  /**
   * Stores an email subscription for a published email_capture block.
   *
   * - Verifies the block exists and is published.
   * - Verifies the block type is email_capture.
   * - Upserts the subscriber (idempotent — no error if already subscribed).
   * - Returns void; callers receive 201 on creation or 200 on duplicate.
   *
   * @throws NotFoundException   if blockId doesn't exist or block is not published
   * @throws UnprocessableEntityException if the block is not an email_capture type
   */
  async createSubscriber(blockId: string, email: string): Promise<{ created: boolean }> {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      // Also fetch the page (for artistId + pageId) so we can emit a typed event.
      select: {
        type: true,
        isPublished: true,
        page: {
          select: {
            id: true,
            artistId: true,
            artist: { select: { username: true } },
          },
        },
      },
    });

    if (!block || !block.isPublished) {
      throw new NotFoundException('Block not found');
    }

    if (block.type !== 'email_capture') {
      throw new UnprocessableEntityException('Block does not accept email subscriptions');
    }

    const existing = await this.prisma.subscriber.findUnique({
      where: { blockId_email: { blockId, email: email.toLowerCase().trim() } },
      select: { id: true },
    });

    // Duplicate submission — return early without emitting an event.
    // Tracking re-submits would inflate fan_capture_submit counts and make
    // them inconsistent with the actual subscriber count in the DB.
    if (existing) {
      return { created: false };
    }

    await this.prisma.subscriber.create({
      data: { blockId, email: email.toLowerCase().trim() },
    });

    // Only fire after confirmed DB write — success means a new subscriber was created.
    this.posthog.capture(ANALYTICS_EVENTS.FAN_CAPTURE_SUBMITTED, block.page.artistId, {
      artist_id: block.page.artistId,
      username: block.page.artist.username,
      environment: process.env.NODE_ENV ?? 'development',
      page_id: block.page.id,
      block_id: blockId,
      success: true,
    });

    return { created: true };
  }

  /**
   * Carga la página y bloques públicos de un artista por su ID interno.
   *
   * Todos los accesos a datos públicos deben pasar por aquí,
   * garantizando que el filtrado sea siempre por artistId.
   *
   * @param ctx  Optional analytics context — emits public_page_view event.
   */
  private async loadPublicPage(
    artistId: string,
    ctx?: { locale?: string; referrer?: string; platform?: string; userAgent?: string },
  ): Promise<PublicPageResponseDto> {
    const page = await this.prisma.page.findUnique({
      where: { artistId },
      select: {
        id: true, // needed for page_view analytics event
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

    // En este punto ya sabemos que el artista existe y la página está publicada
    // (fue verificado por TenantResolverService). Si page es null aquí,
    // es una inconsistencia de datos que merece error.
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Fire-and-forget analytics — do not await; page load latency must not be affected.
    // Context is omitted when the page is loaded server-side without a real visitor
    // (e.g. generateMetadata in Next.js — same fetch is de-duped via React.cache).
    if (ctx && !isBotUserAgent(ctx.userAgent)) {
      // Extract referrer domain only — full referrer URL is PII-adjacent.
      let referrer_domain: string | undefined;
      if (ctx.referrer) {
        try {
          referrer_domain = new URL(ctx.referrer).hostname;
        } catch {
          // Malformed Referer header — skip
        }
      }

      this.posthog.capture(
        ANALYTICS_EVENTS.PUBLIC_PAGE_VIEWED,
        artistId, // stable identifier — groups events by artist in PostHog
        {
          artist_id: artistId,
          username: page.artist.username,
          environment: process.env.NODE_ENV ?? 'development',
          page_id: page.id,
          locale: ctx.locale ?? 'en',
          ...(referrer_domain && { referrer_domain }),
          ...(ctx.platform && { platform_detected: ctx.platform }),
        },
      );
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
