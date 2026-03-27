import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership } from '../../common/decorators';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * GET /api/blocks/:pageId
   *
   * Returns ordered blocks for a given page.
   * Ownership enforced: request.user must own the artist that owns this page.
   * JwtAuthGuard is applied globally via APP_GUARD — no need to repeat it here.
   */
  @Get(':pageId')
  @CheckOwnership('page', 'pageId')
  @UseGuards(OwnershipGuard)
  findByPage(@Param('pageId') pageId: string) {
    return this.blocksService.findByPage(pageId);
  }
}
