import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import { PublicPageResponseDto, PublicBlockDto } from './dto/public-page-response.dto';

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
  ) {}

  /**
   * Retorna la página pública de un artista resuelto por username.
   *
   * @throws NotFoundException si el username no existe, no está publicado
   *         o el artista no tiene página
   */
  async getPageByUsername(rawUsername: string): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByUsername(rawUsername);

    if (!tenant) {
      // Mensaje genérico — no reflejar input del usuario en la respuesta.
      throw new NotFoundException('Artist not found');
    }

    return this.loadPublicPage(tenant.artistId);
  }

  /**
   * Retorna la página pública de un artista resuelto por dominio.
   * Preparado para uso con custom domains.
   *
   * @param host - Host header normalizado (sin puerto, sin www)
   * @throws NotFoundException si el dominio no resuelve a ningún artista
   */
  async getPageByDomain(host: string): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByDomain(host);

    if (!tenant) {
      // Mensaje genérico — no reflejar el Host header en la respuesta.
      throw new NotFoundException('Not found');
    }

    return this.loadPublicPage(tenant.artistId);
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
      select: { type: true, isPublished: true },
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

    if (existing) {
      return { created: false };
    }

    await this.prisma.subscriber.create({
      data: { blockId, email: email.toLowerCase().trim() },
    });

    return { created: true };
  }

  /**
   * Carga la página y bloques públicos de un artista por su ID interno.
   *
   * Todos los accesos a datos públicos deben pasar por aquí,
   * garantizando que el filtrado sea siempre por artistId.
   */
  private async loadPublicPage(artistId: string): Promise<PublicPageResponseDto> {
    const page = await this.prisma.page.findUnique({
      where: { artistId },
      select: {
        artist: {
          select: {
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
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

    return {
      artist: {
        username: page.artist.username,
        displayName: page.artist.displayName,
        bio: page.artist.bio,
        avatarUrl: page.artist.avatarUrl,
        coverUrl: page.artist.coverUrl,
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
