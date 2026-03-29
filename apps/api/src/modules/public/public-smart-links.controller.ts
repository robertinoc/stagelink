import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { SmartLinksService } from '../smart-links/smart-links.service';
import type { SmartLinkPlatform } from '@stagelink/types';
import { SMART_LINK_PLATFORMS } from '@stagelink/types';

/**
 * PublicSmartLinksController — unauthenticated resolution endpoint.
 *
 * GET /api/public/smart-links/:id/resolve?platform={ios|android|desktop|all}
 *
 * Called by the Next.js /go/[id] route handler.
 * Returns { url } or 404.
 *
 * Platform is required. The frontend always supplies it (derived from User-Agent).
 * Invalid platform values fall back to 'desktop' rather than returning 400 —
 * a new platform variant should not break old frontend deployments.
 */
@Public()
@Controller('public/smart-links')
export class PublicSmartLinksController {
  constructor(private readonly smartLinksService: SmartLinksService) {}

  @Get(':id/resolve')
  resolve(@Param('id') id: string, @Query('platform') platform: string): Promise<{ url: string }> {
    const normalised: SmartLinkPlatform = SMART_LINK_PLATFORMS.includes(
      platform as SmartLinkPlatform,
    )
      ? (platform as SmartLinkPlatform)
      : 'desktop';

    return this.smartLinksService.resolve(id, normalised);
  }
}
