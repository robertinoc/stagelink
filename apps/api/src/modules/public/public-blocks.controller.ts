import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { PublicPagesService } from './public-pages.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { Public } from '../../common/decorators';

/**
 * PublicBlocksController — public endpoints scoped to individual blocks.
 *
 * Routes (with global /api prefix):
 *   POST /api/public/blocks/:blockId/subscribers
 *
 * No authentication required.
 */
@Public()
@Controller('public/blocks')
export class PublicBlocksController {
  constructor(private readonly publicPagesService: PublicPagesService) {}

  /**
   * POST /api/public/blocks/:blockId/subscribers
   *
   * Stores a fan's email for a published email_capture block.
   * Idempotent — posting the same email twice returns 200 both times.
   *
   * 404 if the block doesn't exist or isn't published.
   * 422 if the block type doesn't accept subscriptions.
   */
  @Post(':blockId/subscribers')
  @HttpCode(200)
  async createSubscriber(
    @Param('blockId') blockId: string,
    @Body() dto: CreateSubscriberDto,
  ): Promise<{ ok: boolean }> {
    await this.publicPagesService.createSubscriber(blockId, dto.email);
    return { ok: true };
  }
}
