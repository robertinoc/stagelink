import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PublicSubscribeService } from './public-subscribe.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { Public } from '../../common/decorators';
import { PublicRateLimitGuard } from '../../common/guards';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';
import { extractClientIp } from '../../common/utils/request.utils';

/**
 * PublicBlocksController — public endpoints scoped to individual blocks.
 *
 * Routes (with global /api prefix):
 *   POST /api/public/blocks/:blockId/subscribers
 *
 * No authentication required. Rate-limited by IP (PublicRateLimitGuard).
 */
@Public()
@Controller('public/blocks')
@UseGuards(PublicRateLimitGuard)
export class PublicBlocksController {
  constructor(private readonly publicSubscribeService: PublicSubscribeService) {}

  /**
   * POST /api/public/blocks/:blockId/subscribers
   *
   * Stores a fan's email for a published email_capture block.
   * Idempotent — posting the same email twice returns 200 both times.
   *
   * Security:
   *   - Rate-limited (PublicRateLimitGuard: 120 req/60s per IP)
   *   - Honeypot: if `website` field is non-empty, silently returns 200 (no DB write)
   *   - Consent enforced if block.config.requireConsent === true
   *   - Block must exist and be published
   *
   * 400 if consent missing when required.
   * 404 if block doesn't exist or isn't published.
   * 422 if block type doesn't accept subscriptions.
   */
  @Post(':blockId/subscribers')
  @HttpCode(200)
  async createSubscriber(
    @Param('blockId', ParseCuidPipe) blockId: string,
    @Body() dto: CreateSubscriberDto,
    @Req() req: Request,
  ): Promise<{ ok: boolean }> {
    await this.publicSubscribeService.createSubscriber(blockId, dto, extractClientIp(req));
    return { ok: true };
  }
}
