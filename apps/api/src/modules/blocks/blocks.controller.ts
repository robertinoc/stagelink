import { Controller, Get, Param } from '@nestjs/common';
import { BlocksService } from './blocks.service';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * GET /api/blocks/:pageId
   * Returns ordered blocks for a given page.
   * TODO: Validate auth + ownership before returning.
   */
  @Get(':pageId')
  findByPage(@Param('pageId') pageId: string) {
    return this.blocksService.findByPage(pageId);
  }
}
