import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type BlockType, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { PostHogService } from '../analytics/posthog.service';
import {
  validateBlockConfig,
  validateBlockTitle,
  enrichBlockConfig,
  sanitizeBlockConfig,
} from './schemas/block-config.schema';
import { CreateBlockDto, UpdateBlockDto, ReorderBlocksDto } from './dto';
import { SmartLinksService } from '../smart-links/smart-links.service';
import { ANALYTICS_EVENTS } from '@stagelink/types';

// Maximum blocks allowed per page — prevents unbounded data growth.
const MAX_BLOCKS_PER_PAGE = 50;

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly smartLinksService: SmartLinksService,
    private readonly posthog: PostHogService,
  ) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  /**
   * Returns all blocks for a page ordered by position asc.
   * Caller must have at least read access on the artist.
   */
  async findByPage(pageId: string, userId: string) {
    const artistId = await this.resolvePageArtist(pageId);
    await this.membershipService.validateAccess(userId, artistId, 'read');

    return this.prisma.block.findMany({
      where: { pageId },
      orderBy: { position: 'asc' },
    });
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * Creates a new block at the end of the page's list.
   * Enforces per-page block limit and validates config for the given type.
   */
  async create(pageId: string, dto: CreateBlockDto, userId: string, ipAddress?: string) {
    const artistId = await this.resolvePageArtist(pageId);
    await this.membershipService.validateAccess(userId, artistId, 'write');

    validateBlockTitle(dto.title);
    const blockType = dto.type as BlockType;
    validateBlockConfig(blockType, dto.config);

    // Guard: verify that any referenced smartLinkIds belong to this artist.
    // Prevents IDOR where a user embeds another artist's SmartLink in their block.
    if (blockType === 'links') {
      await this.smartLinksService.verifySmartLinkOwnership(
        dto.config as Record<string, unknown>,
        artistId,
      );
    }

    const enrichedConfig = sanitizeBlockConfig(
      blockType,
      enrichBlockConfig(blockType, dto.config as Record<string, unknown>),
    );

    // Wrap count + position lookup + insert in a single transaction so two
    // concurrent creates on the same page cannot race past the block limit or
    // land on the same position value.
    const block = await this.prisma.$transaction(async (tx) => {
      const blockCount = await tx.block.count({ where: { pageId } });
      if (blockCount >= MAX_BLOCKS_PER_PAGE) {
        throw new UnprocessableEntityException(
          `A page can have at most ${MAX_BLOCKS_PER_PAGE} blocks`,
        );
      }

      const last = await tx.block.findFirst({
        where: { pageId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      const position = (last?.position ?? -1) + 1;

      return tx.block.create({
        data: {
          pageId,
          type: blockType,
          title: dto.title?.trim() ?? null,
          config: enrichedConfig as Prisma.InputJsonValue,
          position,
          isPublished: false,
        },
      });
    });

    this.auditService.log({
      actorId: userId,
      action: 'block.create',
      entityType: 'block',
      entityId: block.id,
      metadata: { pageId, type: dto.type },
      ipAddress,
    });

    this.posthog.capture(ANALYTICS_EVENTS.BLOCK_CREATED, userId, {
      actor_user_id: userId,
      artist_id: artistId,
      environment: process.env.NODE_ENV ?? 'development',
      block_id: block.id,
      block_type: block.type,
      page_id: pageId,
    });

    return block;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  /**
   * Updates title and/or config of a block.
   * Config is deep-merged with existing config then re-validated for the type.
   */
  async update(blockId: string, dto: UpdateBlockDto, userId: string, ipAddress?: string) {
    const { block, artistId } = await this.resolveBlock(blockId);
    await this.membershipService.validateAccess(userId, artistId, 'write');

    if (dto.title !== undefined) {
      validateBlockTitle(dto.title);
    }

    let enrichedConfig: Record<string, unknown> | undefined;
    if (dto.config !== undefined) {
      const existing =
        typeof block.config === 'object' && block.config !== null
          ? (block.config as Record<string, unknown>)
          : {};
      const mergedConfig = { ...existing, ...dto.config };
      validateBlockConfig(block.type, mergedConfig);

      // Guard: verify that any referenced smartLinkIds belong to this artist.
      if (block.type === 'links') {
        await this.smartLinksService.verifySmartLinkOwnership(mergedConfig, artistId);
      }

      enrichedConfig = sanitizeBlockConfig(block.type, enrichBlockConfig(block.type, mergedConfig));
    }

    const updated = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() || null }),
        ...(enrichedConfig !== undefined && {
          config: enrichedConfig as Prisma.InputJsonValue,
        }),
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'block.update',
      entityType: 'block',
      entityId: blockId,
      metadata: { changes: dto as Record<string, unknown> },
      ipAddress,
    });

    this.posthog.capture(ANALYTICS_EVENTS.BLOCK_UPDATED, userId, {
      actor_user_id: userId,
      artist_id: artistId,
      environment: process.env.NODE_ENV ?? 'development',
      block_id: blockId,
      block_type: block.type,
      page_id: block.pageId,
    });

    return updated;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  /**
   * Hard-deletes a block. Position gaps are harmless — blocks render by
   * sort order, not by contiguity.
   * Audit is written before deletion so entityId is still meaningful.
   */
  async remove(blockId: string, userId: string, ipAddress?: string) {
    const { block, artistId } = await this.resolveBlock(blockId);
    await this.membershipService.validateAccess(userId, artistId, 'write');

    this.auditService.log({
      actorId: userId,
      action: 'block.delete',
      entityType: 'block',
      entityId: blockId,
      metadata: { type: block.type, pageId: block.pageId },
      ipAddress,
    });

    this.posthog.capture(ANALYTICS_EVENTS.BLOCK_DELETED, userId, {
      actor_user_id: userId,
      artist_id: artistId,
      environment: process.env.NODE_ENV ?? 'development',
      block_id: blockId,
      block_type: block.type,
      page_id: block.pageId,
    });

    await this.prisma.block.delete({ where: { id: blockId } });
  }

  // ─── Reorder ──────────────────────────────────────────────────────────────

  /**
   * Batch-updates positions for a set of blocks.
   * The `pageId` constraint in each UPDATE prevents cross-page position injection.
   */
  async reorder(pageId: string, dto: ReorderBlocksDto, userId: string, ipAddress?: string) {
    const artistId = await this.resolvePageArtist(pageId);
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const positions = dto.blocks.map((b) => b.position);
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException('Duplicate positions in reorder request');
    }

    // Ensure the payload covers every block on the page so positions remain
    // consistent. A partial reorder would leave gaps/collisions in DB state.
    const pageBlockIds = await this.prisma.block
      .findMany({ where: { pageId }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id).sort());
    const payloadIds = dto.blocks.map((b) => b.id).sort();
    if (
      pageBlockIds.length !== payloadIds.length ||
      pageBlockIds.some((id, i) => id !== payloadIds[i])
    ) {
      throw new BadRequestException('Reorder payload must include all blocks on the page');
    }

    try {
      await this.prisma.$transaction(
        dto.blocks.map(({ id, position }) =>
          this.prisma.block.update({
            where: { id, pageId }, // pageId ensures block belongs to this page
            data: { position },
          }),
        ),
      );
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('One or more blocks not found for this page');
      }
      throw err;
    }

    this.auditService.log({
      actorId: userId,
      action: 'block.reorder',
      entityType: 'page',
      entityId: pageId,
      metadata: { count: dto.blocks.length },
      ipAddress,
    });

    return this.prisma.block.findMany({
      where: { pageId },
      orderBy: { position: 'asc' },
    });
  }

  // ─── Publish / Unpublish ──────────────────────────────────────────────────

  /**
   * Marks a block as published (visible on the public page).
   */
  async publish(blockId: string, userId: string, ipAddress?: string) {
    const { artistId } = await this.resolveBlock(blockId);
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const block = await this.prisma.block.update({
      where: { id: blockId },
      data: { isPublished: true },
    });

    this.auditService.log({
      actorId: userId,
      action: 'block.publish',
      entityType: 'block',
      entityId: blockId,
      ipAddress,
    });

    this.posthog.capture(ANALYTICS_EVENTS.BLOCK_PUBLISHED, userId, {
      actor_user_id: userId,
      artist_id: artistId,
      environment: process.env.NODE_ENV ?? 'development',
      block_id: blockId,
      block_type: block.type,
      page_id: block.pageId,
    });

    return block;
  }

  /**
   * Marks a block as unpublished (hidden from the public page).
   */
  async unpublish(blockId: string, userId: string, ipAddress?: string) {
    const { artistId } = await this.resolveBlock(blockId);
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const block = await this.prisma.block.update({
      where: { id: blockId },
      data: { isPublished: false },
    });

    this.auditService.log({
      actorId: userId,
      action: 'block.unpublish',
      entityType: 'block',
      entityId: blockId,
      ipAddress,
    });

    this.posthog.capture(ANALYTICS_EVENTS.BLOCK_UNPUBLISHED, userId, {
      actor_user_id: userId,
      artist_id: artistId,
      environment: process.env.NODE_ENV ?? 'development',
      block_id: blockId,
      block_type: block.type,
      page_id: block.pageId,
    });

    return block;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async resolvePageArtist(pageId: string): Promise<string> {
    const artistId = await this.membershipService.resolveArtistIdForResource('page', pageId);
    if (!artistId) throw new NotFoundException('Page not found');
    return artistId;
  }

  private async resolveBlock(blockId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: { page: { select: { artistId: true } } },
    });
    if (!block) throw new NotFoundException('Block not found');
    return { block, artistId: block.page.artistId };
  }
}
