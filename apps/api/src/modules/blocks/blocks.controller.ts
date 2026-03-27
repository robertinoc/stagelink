import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { BlocksService, CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from './blocks.service';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership, CurrentUser } from '../../common/decorators';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /**
   * GET /api/blocks/:pageId
   * Returns ordered blocks for a page.
   */
  @Get(':pageId')
  @CheckOwnership('page', 'pageId', 'read')
  @UseGuards(OwnershipGuard)
  findByPage(@Param('pageId') pageId: string, @CurrentUser() user: User) {
    return this.blocksService.findByPage(pageId, user.id);
  }

  /**
   * POST /api/blocks
   * Creates a new block. pageId comes from body.
   */
  @Post()
  create(@Body() dto: CreateBlockDto, @CurrentUser() user: User, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.blocksService.create(dto, user.id, ip);
  }

  /**
   * PATCH /api/blocks/:id
   */
  @Patch(':id')
  @CheckOwnership('block', 'id', 'write')
  @UseGuards(OwnershipGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlockDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.blocksService.update(id, dto, user.id, ip);
  }

  /**
   * DELETE /api/blocks/:id
   */
  @Delete(':id')
  @CheckOwnership('block', 'id', 'write')
  @UseGuards(OwnershipGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.blocksService.remove(id, user.id, ip);
  }

  /**
   * PATCH /api/blocks/page/:pageId/reorder
   */
  @Patch('page/:pageId/reorder')
  @CheckOwnership('page', 'pageId', 'write')
  @UseGuards(OwnershipGuard)
  reorder(
    @Param('pageId') pageId: string,
    @Body() dto: ReorderBlocksDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.blocksService.reorder(pageId, dto, user.id, ip);
  }
}
