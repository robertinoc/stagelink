import { Injectable, NotFoundException } from '@nestjs/common';
import { type BlockType, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';

export interface CreateBlockDto {
  pageId: string;
  type: BlockType;
  title?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateBlockDto {
  type?: BlockType;
  title?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  position?: number;
  isVisible?: boolean;
}

export interface ReorderBlocksDto {
  blocks: Array<{ id: string; position: number }>;
}

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
  ) {}

  async findByPage(pageId: string, userId: string) {
    const artistId = await this.membershipService.resolveArtistIdForResource('page', pageId);
    if (!artistId) throw new NotFoundException('Page not found');
    await this.membershipService.validateAccess(userId, artistId, 'read');

    return this.prisma.block.findMany({
      where: { pageId },
      orderBy: { position: 'asc' },
    });
  }

  async create(dto: CreateBlockDto, userId: string, ipAddress?: string) {
    const artistId = await this.membershipService.resolveArtistIdForResource('page', dto.pageId);
    if (!artistId) throw new NotFoundException('Page not found');
    await this.membershipService.validateAccess(userId, artistId, 'write');

    // Get max position
    const maxPositionBlock = await this.prisma.block.findFirst({
      where: { pageId: dto.pageId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = (maxPositionBlock?.position ?? -1) + 1;

    const block = await this.prisma.block.create({
      data: {
        pageId: dto.pageId,
        type: dto.type,
        title: dto.title ?? null,
        url: dto.url ?? null,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        position: nextPosition,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'block.create',
      entityType: 'block',
      entityId: block.id,
      metadata: { pageId: dto.pageId, type: dto.type },
      ipAddress,
    });

    return block;
  }

  async update(blockId: string, dto: UpdateBlockDto, userId: string, ipAddress?: string) {
    const artistId = await this.membershipService.resolveArtistIdForResource('block', blockId);
    if (!artistId) throw new NotFoundException('Block not found');
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const { metadata, ...rest } = dto;
    const block = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        ...rest,
        ...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
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

    return block;
  }

  async remove(blockId: string, userId: string, ipAddress?: string) {
    const artistId = await this.membershipService.resolveArtistIdForResource('block', blockId);
    if (!artistId) throw new NotFoundException('Block not found');
    await this.membershipService.validateAccess(userId, artistId, 'write');

    await this.prisma.block.delete({ where: { id: blockId } });

    this.auditService.log({
      actorId: userId,
      action: 'block.delete',
      entityType: 'block',
      entityId: blockId,
      ipAddress,
    });
  }

  async reorder(pageId: string, dto: ReorderBlocksDto, userId: string, ipAddress?: string) {
    const artistId = await this.membershipService.resolveArtistIdForResource('page', pageId);
    if (!artistId) throw new NotFoundException('Page not found');
    await this.membershipService.validateAccess(userId, artistId, 'write');

    await this.prisma.$transaction(
      dto.blocks.map(({ id, position }) =>
        this.prisma.block.update({
          where: { id, pageId },
          data: { position },
        }),
      ),
    );

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
}
