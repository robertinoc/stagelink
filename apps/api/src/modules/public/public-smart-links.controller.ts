import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators';
import { SmartLinksService } from '../smart-links/smart-links.service';
import type { SmartLinkPlatform } from '@stagelink/types';
import { SMART_LINK_PLATFORMS } from '@stagelink/types';

/**
 * PublicSmartLinksController — unauthenticated resolution endpoint.
 *
 * GET /api/public/smart-links/:id/resolve?platform={ios|android|desktop|all}&from=<blockId>:<itemId>
 *
 * Called by the Next.js /go/[id] route handler.
 * Returns { url } or 404.
 *
 * Platform is required. The frontend always supplies it (derived from User-Agent).
 * Invalid platform values fall back to 'desktop' rather than returning 400 —
 * a new platform variant should not break old frontend deployments.
 *
 * `from` is optional. When present (format: `${blockId}:${itemId}`), it is
 * forwarded to the service for per-item click attribution in the audit log.
 */
@Public()
@Controller('public/smart-links')
export class PublicSmartLinksController {
  constructor(private readonly smartLinksService: SmartLinksService) {}

  @Get(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Query('platform') platform: string,
    @Query('from') from: string | undefined,
    @Req() req: Request,
  ): Promise<{ url: string }> {
    const normalised: SmartLinkPlatform = SMART_LINK_PLATFORMS.includes(
      platform as SmartLinkPlatform,
    )
      ? (platform as SmartLinkPlatform)
      : 'desktop';

    const forwarded = req.headers['x-forwarded-for'];
    const raw = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded) : undefined;
    const ipAddress = raw?.split(',')[0]?.trim() || undefined;

    return this.smartLinksService.resolve(id, normalised, { from, ipAddress });
  }
}
