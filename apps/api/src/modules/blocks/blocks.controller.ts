import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard, OwnershipGuard } from '../../common/guards';

@Controller('blocks')
@UseGuards(JwtAuthGuard) // All block endpoints require authentication
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * GET /api/blocks/:pageId
   * Returns ordered blocks for a given page.
   * Ownership check: requester must own the artist that owns this page.
   *
   * TODO (T2): Implement OwnershipGuard with real JWT + DB lookup.
   * For now, JwtAuthGuard stub allows all requests — safe because no real DB yet.
   */
  @Get(':pageId')
  @UseGuards(OwnershipGuard)
  findByPage(@Param('pageId') pageId: string) {
    return this.blocksService.findByPage(pageId);
  }
}
