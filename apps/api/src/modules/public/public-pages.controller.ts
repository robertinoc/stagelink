import { Controller, Get, Headers, Param } from '@nestjs/common';
import { PublicPagesService } from './public-pages.service';
import { PublicPageResponseDto } from './dto/public-page-response.dto';

/**
 * PublicPagesController — endpoints públicos de páginas de artistas.
 *
 * Rutas (con global prefix /api):
 *   GET /api/public/pages/by-username/:username
 *   GET /api/public/pages/by-domain
 *
 * Estas rutas no requieren autenticación.
 * No exponen datos privados del tenant.
 *
 * Estrategia de resolución:
 * - by-username: el username está en la URL path
 * - by-domain: el dominio se lee del Header `Host`
 *   (cuando llegue el soporte de custom domains, el frontend
 *    o el reverse proxy forward este header correctamente)
 */
@Controller('public/pages')
export class PublicPagesController {
  constructor(private readonly publicPagesService: PublicPagesService) {}

  /**
   * GET /api/public/pages/by-username/:username
   *
   * Resuelve la página pública de un artista por su username.
   * Retorna 404 si el username no existe o la página no está publicada.
   */
  @Get('by-username/:username')
  getByUsername(@Param('username') username: string): Promise<PublicPageResponseDto> {
    return this.publicPagesService.getPageByUsername(username);
  }

  /**
   * GET /api/public/pages/by-domain
   *
   * Resuelve la página pública de un artista por el Host header.
   * Preparado para custom domains — actualmente retornará 404 para
   * todos los hosts hasta que se activen custom domains en producción.
   *
   * El header Host lo envía el cliente (browser/fetch) automáticamente.
   * En entornos con reverse proxy, asegurarse de que el header sea forwarded.
   */
  @Get('by-domain')
  getByDomain(@Headers('host') host: string): Promise<PublicPageResponseDto> {
    return this.publicPagesService.getPageByDomain(host);
  }
}
