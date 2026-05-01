import { Controller, Get, Headers, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators';
import { PublicRateLimitGuard } from '../../common/guards/public-rate-limit.guard';
import { SmartLinksService } from '../smart-links/smart-links.service';
import type { SmartLinkPlatform } from '@stagelink/types';
import { SMART_LINK_PLATFORMS } from '@stagelink/types';
import { extractClientIp } from '../../common/utils/request.utils';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';

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
 * Validated server-side: must match `<alphanum/dash>:<alphanum/dash>` and be
 * at most 200 characters to prevent audit log bloat from arbitrary input.
 *
 * TODO (P3): add `?preview=1` with artist auth to allow previewing inactive links.
 */

/** Max length for the `from` attribution param (blockId:itemId = 73 chars typical). */
const MAX_FROM_LENGTH = 200;
/** Expected format: two UUID/CUID segments separated by a colon. */
const FROM_PATTERN = /^[\w-]+:[\w-]+$/;

@Public()
@UseGuards(PublicRateLimitGuard)
@Controller('public/smart-links')
export class PublicSmartLinksController {
  constructor(private readonly smartLinksService: SmartLinksService) {}

  @Get(':id/resolve')
  resolve(
    @Param('id', ParseCuidPipe) id: string,
    @Query('platform') platform: string,
    @Query('from') from: string | undefined,
    @Req() req: Request,
    // T4-4 quality headers — forwarded by the web tier from visitor cookies
    @Headers('user-agent') userAgent?: string,
    @Headers('x-sl-qa') slQa?: string,
    @Headers('x-sl-ac') slAc?: string,
    @Headers('x-sl-internal') slInternal?: string,
  ): Promise<{ url: string }> {
    const normalised: SmartLinkPlatform = SMART_LINK_PLATFORMS.includes(
      platform as SmartLinkPlatform,
    )
      ? (platform as SmartLinkPlatform)
      : 'desktop';

    // Sanitise `from` — reject oversized or malformed values to prevent
    // arbitrary strings from reaching the audit log metadata column.
    const sanitisedFrom =
      from && from.length <= MAX_FROM_LENGTH && FROM_PATTERN.test(from) ? from : undefined;

    const ipAddress = extractClientIp(req);

    return this.smartLinksService.resolve(id, normalised, {
      from: sanitisedFrom,
      ipAddress,
      userAgent,
      slQa,
      slAc,
      slInternal,
    });
  }
}
