import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { BlocksService } from './blocks.service';
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from './dto';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership, CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';

/**
 * Route map:
 *   GET    /api/pages/:pageId/blocks          — list blocks (PagesBlocksController)
 *   POST   /api/pages/:pageId/blocks          — create block
 *   PATCH  /api/pages/:pageId/blocks/reorder  — batch reorder
 *   PATCH  /api/blocks/:blockId               — update title/config
 *   DELETE /api/blocks/:blockId               — hard delete
 *   POST   /api/blocks/:blockId/publish       — mark published
 *   POST   /api/blocks/:blockId/unpublish     — mark unpublished
 *
 * Split into two controllers to avoid route collision:
 *   BlocksController       → /api/blocks/:blockId (block-level ops)
 *   PagesBlocksController  → /api/pages/:pageId/blocks (page-scoped ops)
 *
 * Security:
 *   - JwtAuthGuard is global — all routes require a valid JWT.
 *   - OwnershipGuard verifies the caller is a member of the parent artist
 *     with the required access level (read or write).
 *   - pageId/blockId ownership is never trusted from the request body —
 *     always resolved server-side via MembershipService.
 */

// ─── /api/blocks/:blockId ─────────────────────────────────────────────────────

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /** PATCH /api/blocks/:blockId — update title and/or config */
  @Patch(':blockId')
  @CheckOwnership('block', 'blockId', 'write')
  @UseGuards(OwnershipGuard)
  update(
    @Param('blockId') blockId: string,
    @Body() dto: UpdateBlockDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.blocksService.update(blockId, dto, user.id, extractClientIp(req));
  }

  /** DELETE /api/blocks/:blockId */
  @Delete(':blockId')
  @CheckOwnership('block', 'blockId', 'write')
  @UseGuards(OwnershipGuard)
  remove(@Param('blockId') blockId: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.blocksService.remove(blockId, user.id, extractClientIp(req));
  }

  /** POST /api/blocks/:blockId/publish — make block visible on public page */
  @Post(':blockId/publish')
  @CheckOwnership('block', 'blockId', 'write')
  @UseGuards(OwnershipGuard)
  publish(@Param('blockId') blockId: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.blocksService.publish(blockId, user.id, extractClientIp(req));
  }

  /** POST /api/blocks/:blockId/unpublish — hide block from public page */
  @Post(':blockId/unpublish')
  @CheckOwnership('block', 'blockId', 'write')
  @UseGuards(OwnershipGuard)
  unpublish(@Param('blockId') blockId: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.blocksService.unpublish(blockId, user.id, extractClientIp(req));
  }
}

// ─── /api/pages/:pageId/blocks ───────────────────────────────────────────────

/**
 * Page-scoped block endpoints.
 * Kept in a separate controller so that NestJS never confuses
 * PATCH /blocks/:blockId with PATCH /blocks/page/:pageId/reorder.
 */
@Controller('pages/:pageId/blocks')
export class PagesBlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  /** GET /api/pages/:pageId/blocks — ordered block list */
  @Get()
  @CheckOwnership('page', 'pageId', 'read')
  @UseGuards(OwnershipGuard)
  findByPage(@Param('pageId') pageId: string, @CurrentUser() user: User) {
    return this.blocksService.findByPage(pageId, user.id);
  }

  /** POST /api/pages/:pageId/blocks — create block at end of list */
  @Post()
  @CheckOwnership('page', 'pageId', 'write')
  @UseGuards(OwnershipGuard)
  create(
    @Param('pageId') pageId: string,
    @Body() dto: CreateBlockDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.blocksService.create(pageId, dto, user.id, extractClientIp(req));
  }

  /**
   * PATCH /api/pages/:pageId/blocks/reorder
   * Body: { blocks: [{ id: string, position: number }] }
   */
  @Patch('reorder')
  @CheckOwnership('page', 'pageId', 'write')
  @UseGuards(OwnershipGuard)
  reorder(
    @Param('pageId') pageId: string,
    @Body() dto: ReorderBlocksDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.blocksService.reorder(pageId, dto, user.id, extractClientIp(req));
  }
}
