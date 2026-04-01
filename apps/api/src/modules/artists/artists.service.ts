import { Injectable, ConflictException } from '@nestjs/common';
import { ArtistCategory } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { PostHogService } from '../analytics/posthog.service';
import { ANALYTICS_EVENTS } from '@stagelink/types';

// ── Internal payload types (not exported — presentation DTOs live in dto/) ───

interface CreateArtistPayload {
  username: string;
  displayName: string;
  bio?: string;
}

/**
 * Subset of Artist fields that can be updated via PATCH /api/artists/:id.
 * Username is NOT included — it is the immutable multi-tenant key.
 * Avatar/cover are NOT included — they are managed via the assets pipeline.
 */
interface UpdateArtistPayload {
  displayName?: string;
  bio?: string | null;
  category?: ArtistCategory;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  spotifyUrl?: string | null;
  soundcloudUrl?: string | null;
  websiteUrl?: string | null;
  contactEmail?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

@Injectable()
export class ArtistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly posthog: PostHogService,
  ) {}

  async findAllForUser(userId: string) {
    const artistIds = await this.membershipService.getArtistIdsForUser(userId);
    return this.prisma.artist.findMany({
      where: { id: { in: artistIds } },
      include: { memberships: { where: { userId }, select: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    await this.membershipService.validateAccess(userId, id, 'read');
    return this.prisma.artist.findUniqueOrThrow({ where: { id } });
  }

  async create(payload: CreateArtistPayload, userId: string, ipAddress?: string) {
    const existing = await this.prisma.artist.findUnique({
      where: { username: payload.username },
    });
    if (existing) {
      throw new ConflictException(`Username "${payload.username}" is already taken`);
    }

    const artist = await this.prisma.$transaction(async (tx) => {
      const created = await tx.artist.create({
        data: {
          username: payload.username,
          displayName: payload.displayName,
          bio: payload.bio ?? null,
          userId,
        },
      });

      await tx.artistMembership.create({
        data: { artistId: created.id, userId, role: 'owner' },
      });

      return created;
    });

    this.auditService.log({
      actorId: userId,
      action: 'artist.create',
      entityType: 'artist',
      entityId: artist.id,
      metadata: { username: artist.username, displayName: artist.displayName },
      ipAddress,
    });

    return artist;
  }

  async update(id: string, payload: UpdateArtistPayload, userId: string, ipAddress?: string) {
    await this.membershipService.validateAccess(userId, id, 'write');

    const artist = await this.prisma.artist.update({
      where: { id },
      data: {
        // Only spread defined keys — Prisma ignores undefined values.
        // This avoids accidentally clearing fields that weren't sent.
        ...(payload.displayName !== undefined && { displayName: payload.displayName }),
        ...(payload.bio !== undefined && { bio: payload.bio }),
        ...(payload.category !== undefined && { category: payload.category }),
        ...(payload.instagramUrl !== undefined && { instagramUrl: payload.instagramUrl }),
        ...(payload.tiktokUrl !== undefined && { tiktokUrl: payload.tiktokUrl }),
        ...(payload.youtubeUrl !== undefined && { youtubeUrl: payload.youtubeUrl }),
        ...(payload.spotifyUrl !== undefined && { spotifyUrl: payload.spotifyUrl }),
        ...(payload.soundcloudUrl !== undefined && { soundcloudUrl: payload.soundcloudUrl }),
        ...(payload.websiteUrl !== undefined && { websiteUrl: payload.websiteUrl }),
        ...(payload.contactEmail !== undefined && { contactEmail: payload.contactEmail }),
        ...(payload.seoTitle !== undefined && { seoTitle: payload.seoTitle }),
        ...(payload.seoDescription !== undefined && { seoDescription: payload.seoDescription }),
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'artist.profile.updated',
      entityType: 'artist',
      entityId: id,
      metadata: { fields: Object.keys(payload) },
      ipAddress,
    });

    this.posthog.capture(ANALYTICS_EVENTS.ARTIST_PROFILE_UPDATED, userId, {
      actor_user_id: userId,
      artist_id: id,
      environment: process.env.NODE_ENV ?? 'development',
      updated_fields: Object.keys(payload),
    });

    return artist;
  }

  async remove(id: string, userId: string, ipAddress?: string) {
    await this.membershipService.validateAccess(userId, id, 'owner');

    // Fetch before delete for audit log metadata (artist is guaranteed to exist at this point)
    const artist = await this.prisma.artist.findUniqueOrThrow({ where: { id } });

    await this.prisma.artist.delete({ where: { id } });

    this.auditService.log({
      actorId: userId,
      action: 'artist.delete',
      entityType: 'artist',
      entityId: id,
      metadata: { username: artist.username, displayName: artist.displayName },
      ipAddress,
    });
  }
}
