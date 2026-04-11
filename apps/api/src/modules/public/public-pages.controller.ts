import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PublicPagesService } from './public-pages.service';
import { PublicPageResponseDto } from './dto/public-page-response.dto';
import { Public } from '../../common/decorators';
import { PublicRateLimitGuard } from '../../common/guards';
import { detectLocale } from '../../common/utils/locale.util';
import { DEFAULT_LOCALE, isSupportedLocale } from '@stagelink/types';
import { extractClientIp } from '../../common/utils/request.utils';

/** DTO for POST /api/public/events/link-click */
class ReportLinkClickDto {
  @IsString()
  artistId!: string;

  @IsOptional()
  @IsString()
  blockId?: string;

  @IsString()
  @MaxLength(512)
  linkItemId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isSmartLink?: boolean;

  @IsOptional()
  @IsString()
  smartLinkId?: string;
}

/**
 * PublicPagesController — endpoints públicos de páginas de artistas.
 *
 * Rutas (con global prefix /api):
 *   GET  /api/public/pages/by-username/:username
 *   GET  /api/public/pages/by-domain
 *   POST /api/public/events/link-click
 *
 * Estas rutas no requieren autenticación (@Public).
 * No exponen datos privados del tenant.
 */
@Public()
@Controller('public')
export class PublicPagesController {
  constructor(private readonly publicPagesService: PublicPagesService) {}

  /**
   * GET /api/public/pages/by-username/:username
   *
   * Resuelve la página pública de un artista por su username.
   * Retorna 404 si el username no existe o la página no está publicada.
   *
   * Analytics context extracted from standard request headers:
   *   - Accept-Language    → locale
   *   - Referer            → referrer_domain (domain only, privacy)
   *   - Sec-CH-UA-Platform → platform_detected (Chromium client hint)
   *   - X-Forwarded-For    → IP → SHA-256 hash (deduplication, never stored raw)
   *
   * Note: called server-side by Next.js SSR (via React.cache deduplication).
   * The web tier forwards visitor headers so events reflect the real visitor.
   */
  @Get('pages/by-username/:username')
  getByUsername(
    @Param('username') username: string,
    @Req() req: Request,
    @Query('locale') localeQuery?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('referer') referer?: string,
    @Headers('sec-ch-ua-platform') secChUaPlatform?: string,
    @Headers('user-agent') userAgent?: string,
    // T4-4 quality headers — forwarded by the web tier from visitor cookies
    @Headers('x-sl-qa') slQa?: string,
    @Headers('x-sl-ac') slAc?: string,
    @Headers('x-sl-internal') slInternal?: string,
  ): Promise<PublicPageResponseDto> {
    return this.publicPagesService.getPageByUsername(username, {
      locale: isSupportedLocale(localeQuery)
        ? localeQuery
        : acceptLanguage
          ? detectLocale(acceptLanguage)
          : DEFAULT_LOCALE,
      referrer: referer,
      platform: secChUaPlatform?.replace(/"/g, '').toLowerCase() || undefined,
      userAgent,
      ip: extractClientIp(req),
      slQa,
      slAc,
      slInternal,
    });
  }

  /**
   * GET /api/public/pages/by-domain
   *
   * Resuelve la página pública de un artista por el Host header.
   * Preparado para custom domains.
   */
  @Get('pages/by-domain')
  getByDomain(
    @Req() req: Request,
    @Headers('host') host: string,
    @Query('locale') localeQuery?: string,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('referer') referer?: string,
    @Headers('sec-ch-ua-platform') secChUaPlatform?: string,
    @Headers('user-agent') userAgent?: string,
    // T4-4 quality headers — forwarded by the web tier from visitor cookies
    @Headers('x-sl-qa') slQa?: string,
    @Headers('x-sl-ac') slAc?: string,
    @Headers('x-sl-internal') slInternal?: string,
  ): Promise<PublicPageResponseDto> {
    return this.publicPagesService.getPageByDomain(host, {
      locale: isSupportedLocale(localeQuery)
        ? localeQuery
        : acceptLanguage
          ? detectLocale(acceptLanguage)
          : DEFAULT_LOCALE,
      referrer: referer,
      platform: secChUaPlatform?.replace(/"/g, '').toLowerCase() || undefined,
      userAgent,
      ip: extractClientIp(req),
      slQa,
      slAc,
      slInternal,
    });
  }

  /**
   * POST /api/public/events/link-click
   *
   * Records a link_click event when a visitor clicks a link on a public page.
   * Called fire-and-forget from PublicPageClient (browser) after user action.
   *
   * This endpoint is unauthenticated — any party could call it.
   * V1 protection: rate limiting + FK validation (invalid artistId silently ignored).
   * Full event integrity validation (blockId ownership check) is T4-4.
   *
   * Returns 204 on success. Errors are silently swallowed — failed event recording
   * must never surface to the visitor.
   */
  @Post('events/link-click')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PublicRateLimitGuard)
  async reportLinkClick(
    @Body() dto: ReportLinkClickDto,
    @Req() req: Request,
    // T4-4 quality headers — forwarded by the web tier from visitor cookies
    @Headers('user-agent') userAgent?: string,
    @Headers('x-sl-qa') slQa?: string,
    @Headers('x-sl-ac') slAc?: string,
    @Headers('x-sl-internal') slInternal?: string,
  ): Promise<void> {
    const ip = extractClientIp(req);
    // recordLinkClick silently catches FK violations (invalid artistId/blockId).
    await this.publicPagesService.recordLinkClick(
      dto.artistId,
      {
        blockId: dto.blockId,
        linkItemId: dto.linkItemId,
        label: dto.label,
        isSmartLink: dto.isSmartLink,
        smartLinkId: dto.smartLinkId,
      },
      ip,
      { userAgent, slQa, slAc, slInternal },
    );
  }
}
