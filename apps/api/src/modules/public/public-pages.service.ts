import { Injectable, NotFoundException } from '@nestjs/common';
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
          where: { isVisible: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            type: true,
            title: true,
            url: true,
            position: true,
            metadata: true,
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
          url: block.url,
          position: block.position,
          metadata: (block.metadata as Record<string, unknown>) ?? null,
        }),
      ),
    };
  }
}
