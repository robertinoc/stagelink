import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { CreateSmartLinkDto, UpdateSmartLinkDto } from './dto';
import type { SmartLinkDestination, SmartLinkPlatform } from '@stagelink/types';
import { SMART_LINK_PLATFORMS, MAX_URL_LENGTH } from '@stagelink/types';
import { randomUUID } from 'crypto';

// Maximum smart links per artist — prevents unbounded data growth.
const MAX_SMART_LINKS_PER_ARTIST = 50;

// MAX_URL_LENGTH is imported from @stagelink/types — single source of truth.

@Injectable()
export class SmartLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
  ) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  async findByArtist(artistId: string, userId: string) {
    await this.membershipService.validateAccess(userId, artistId, 'read');

    return this.prisma.smartLink.findMany({
      where: { artistId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(artistId: string, dto: CreateSmartLinkDto, userId: string, ipAddress?: string) {
    await this.membershipService.validateAccess(userId, artistId, 'write');

    this.validateDestinations(dto.destinations as SmartLinkDestination[]);

    const count = await this.prisma.smartLink.count({ where: { artistId } });
    if (count >= MAX_SMART_LINKS_PER_ARTIST) {
      throw new BadRequestException(
        `An artist can have at most ${MAX_SMART_LINKS_PER_ARTIST} smart links`,
      );
    }

    // Assign stable UUIDs to any destination that doesn't have one yet.
    const destinations: SmartLinkDestination[] = (dto.destinations as SmartLinkDestination[]).map(
      (d) => ({ ...d, id: d.id ?? randomUUID() }),
    );

    const smartLink = await this.prisma.smartLink.create({
      data: {
        artistId,
        label: dto.label.trim(),
        destinations: destinations as unknown as Prisma.InputJsonValue,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'smart_link.create',
      entityType: 'smart_link',
      entityId: smartLink.id,
      metadata: { artistId, label: dto.label },
      ipAddress,
    });

    return smartLink;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(smartLinkId: string, dto: UpdateSmartLinkDto, userId: string, ipAddress?: string) {
    const { smartLink, artistId } = await this.resolveSmartLink(smartLinkId, userId);

    if (dto.destinations !== undefined) {
      this.validateDestinations(dto.destinations as SmartLinkDestination[]);
    }

    const destinations =
      dto.destinations !== undefined
        ? (dto.destinations as SmartLinkDestination[]).map((d) => ({
            ...d,
            id: d.id ?? randomUUID(),
          }))
        : undefined;

    const updated = await this.prisma.smartLink.update({
      where: { id: smartLinkId },
      data: {
        ...(dto.label !== undefined && { label: dto.label.trim() }),
        ...(destinations !== undefined && {
          destinations: destinations as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'smart_link.update',
      entityType: 'smart_link',
      entityId: smartLinkId,
      metadata: { artistId, changes: dto as Record<string, unknown> },
      ipAddress,
    });

    return updated;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async remove(smartLinkId: string, userId: string, ipAddress?: string) {
    const { artistId } = await this.resolveSmartLink(smartLinkId, userId);

    this.auditService.log({
      actorId: userId,
      action: 'smart_link.delete',
      entityType: 'smart_link',
      entityId: smartLinkId,
      metadata: { artistId },
      ipAddress,
    });

    await this.prisma.smartLink.delete({ where: { id: smartLinkId } });
  }

  // ─── Public resolution ────────────────────────────────────────────────────

  /**
   * Resolves a SmartLink to the appropriate destination URL for the given platform.
   *
   * Resolution order:
   *   1. Exact platform match
   *   2. 'all' platform catch-all
   *   3. NotFoundException
   *
   * Only active SmartLinks are resolved. Inactive ones return 404.
   *
   * @param context.from       Optional attribution string from the link renderer
   *                           (format: `${blockId}:${itemId}`). Logged for analytics.
   * @param context.ipAddress  Visitor IP for the click audit record.
   */
  async resolve(
    smartLinkId: string,
    platform: SmartLinkPlatform,
    context?: { from?: string; ipAddress?: string },
  ): Promise<{ url: string }> {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id: smartLinkId },
      select: { destinations: true, isActive: true },
    });

    if (!smartLink || !smartLink.isActive) {
      throw new NotFoundException('Smart link not found');
    }

    const destinations = smartLink.destinations as SmartLinkDestination[];

    // 1. Exact platform match
    const exact = destinations.find((d) => d.platform === platform);
    const resolved = exact ?? destinations.find((d) => d.platform === 'all');

    if (!resolved) throw new NotFoundException('Smart link not found');

    // Fire-and-forget analytics — do not await; redirect latency must not be affected.
    // TODO: move to a dedicated smart_link_clicks table once the analytics pipeline
    //       is extended. For now, the audit log captures platform, attribution, and IP.
    void this.auditService.log({
      actorId: 'public' as string, // public (unauthenticated) action sentinel
      action: 'smart_link.resolve',
      entityType: 'smart_link',
      entityId: smartLinkId,
      metadata: {
        platform,
        resolvedPlatform: resolved.platform,
        ...(context?.from && { from: context.from }),
      },
      ipAddress: context?.ipAddress,
    });

    return { url: resolved.url };
  }

  // ─── Ownership verification ───────────────────────────────────────────────

  /**
   * Verifies that every `smartLinkId` referenced in a links block config
   * belongs to `artistId`. Throws ForbiddenException if any are cross-tenant.
   *
   * Call this in BlocksService after validateBlockConfig for 'links' blocks
   * to prevent IDOR attacks where a user references another artist's SmartLink.
   */
  async verifySmartLinkOwnership(config: Record<string, unknown>, artistId: string): Promise<void> {
    if (!Array.isArray(config['items'])) return;

    const smartLinkIds = (config['items'] as Record<string, unknown>[])
      .filter((item) => item['kind'] === 'smart_link' && typeof item['smartLinkId'] === 'string')
      .map((item) => item['smartLinkId'] as string);

    if (smartLinkIds.length === 0) return;

    // Deduplicate — a user might reference the same SmartLink in multiple items.
    const uniqueIds = [...new Set(smartLinkIds)];

    const owned = await this.prisma.smartLink.findMany({
      where: { id: { in: uniqueIds }, artistId },
      select: { id: true },
    });

    if (owned.length !== uniqueIds.length) {
      throw new ForbiddenException('One or more smartLinkIds do not belong to this artist');
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async resolveSmartLink(smartLinkId: string, userId: string) {
    const smartLink = await this.prisma.smartLink.findUnique({
      where: { id: smartLinkId },
      select: { artistId: true },
    });
    if (!smartLink) throw new NotFoundException('Smart link not found');

    await this.membershipService.validateAccess(userId, smartLink.artistId, 'write');

    return { smartLink, artistId: smartLink.artistId };
  }

  /**
   * Validates destinations array:
   *   - At least 1 destination required
   *   - No duplicate platforms
   *   - URL must be http(s) and within MAX_URL_LENGTH
   */
  private validateDestinations(destinations: SmartLinkDestination[]): void {
    if (!Array.isArray(destinations) || destinations.length === 0) {
      throw new BadRequestException('destinations must be a non-empty array');
    }

    const seenPlatforms = new Set<string>();
    for (const [i, dest] of destinations.entries()) {
      if (!SMART_LINK_PLATFORMS.includes(dest.platform as SmartLinkPlatform)) {
        throw new BadRequestException(
          `destinations[${i}].platform must be one of: ${SMART_LINK_PLATFORMS.join(', ')}`,
        );
      }
      if (seenPlatforms.has(dest.platform)) {
        throw new BadRequestException(
          `destinations[${i}].platform "${dest.platform}" is duplicated — each platform may appear at most once`,
        );
      }
      seenPlatforms.add(dest.platform);

      if (
        typeof dest.url !== 'string' ||
        dest.url.length === 0 ||
        dest.url.length > MAX_URL_LENGTH
      ) {
        throw new BadRequestException(`destinations[${i}].url is invalid`);
      }
      const lower = dest.url.toLowerCase();
      if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
        throw new BadRequestException(
          `destinations[${i}].url must be a valid http:// or https:// URL`,
        );
      }
    }
  }
}
