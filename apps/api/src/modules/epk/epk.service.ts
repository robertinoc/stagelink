import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Artist } from '@prisma/client';
import type {
  EpkEditorResponse,
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  UpdateEpkPayload,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { UpdateEpkDto } from './dto';
import { buildPublishedEpkSnapshot, getEpkPublishValidation } from './epk.helpers';

type EpkRecord = Prisma.EpkGetPayload<Record<string, never>>;

function sanitizeStringArray(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  return values.map((value) => value.trim()).filter(Boolean);
}

function mapInheritedArtist(artist: Artist) {
  return {
    displayName: artist.displayName,
    username: artist.username,
    avatarUrl: artist.avatarUrl,
    coverUrl: artist.coverUrl,
    bio: artist.bio,
    instagramUrl: artist.instagramUrl,
    tiktokUrl: artist.tiktokUrl,
    youtubeUrl: artist.youtubeUrl,
    spotifyUrl: artist.spotifyUrl,
    soundcloudUrl: artist.soundcloudUrl,
    websiteUrl: artist.websiteUrl,
    contactEmail: artist.contactEmail,
    category: artist.category,
    secondaryCategories: artist.secondaryCategories,
  };
}

function mapEpk(epk: EpkRecord) {
  return {
    id: epk.id,
    artistId: epk.artistId,
    isPublished: epk.isPublished,
    headline: epk.headline,
    shortBio: epk.shortBio,
    fullBio: epk.fullBio,
    pressQuote: epk.pressQuote,
    bookingEmail: epk.bookingEmail,
    managementContact: epk.managementContact,
    pressContact: epk.pressContact,
    heroImageUrl: epk.heroImageUrl,
    galleryImageUrls: epk.galleryImageUrls as unknown as string[],
    featuredMedia: epk.featuredMedia as unknown as EpkFeaturedMediaItem[],
    featuredLinks: epk.featuredLinks as unknown as EpkFeaturedLinkItem[],
    highlights: epk.highlights as unknown as string[],
    riderInfo: epk.riderInfo,
    techRequirements: epk.techRequirements,
    location: epk.location,
    availabilityNotes: epk.availabilityNotes,
    createdAt: epk.createdAt.toISOString(),
    updatedAt: epk.updatedAt.toISOString(),
  };
}

@Injectable()
export class EpkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
  ) {}

  async getEditorData(artistId: string, userId: string): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'read');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'epk_builder');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);

    return {
      epk: mapEpk(epk),
      inherited: mapInheritedArtist(artist),
    };
  }

  async update(
    artistId: string,
    dto: UpdateEpkDto,
    userId: string,
    ipAddress?: string,
  ): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'epk_builder');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const payload = this.buildUpdatePayload(dto);

    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: payload,
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.update',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { fields: Object.keys(dto) },
      ipAddress,
    });

    return {
      epk: mapEpk(updated),
      inherited: mapInheritedArtist(artist),
    };
  }

  async publish(artistId: string, userId: string, ipAddress?: string): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'epk_builder');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const currentFeaturedMedia = epk.featuredMedia as unknown as EpkFeaturedMediaItem[];
    const currentFeaturedLinks = epk.featuredLinks as unknown as EpkFeaturedLinkItem[];
    const currentGalleryImageUrls = epk.galleryImageUrls as unknown as string[];
    const readiness = getEpkPublishValidation(
      {
        headline: epk.headline,
        shortBio: epk.shortBio,
        fullBio: epk.fullBio,
        bookingEmail: epk.bookingEmail,
        managementContact: epk.managementContact,
        pressContact: epk.pressContact,
        heroImageUrl: epk.heroImageUrl,
        galleryImageUrls: currentGalleryImageUrls,
        featuredMedia: currentFeaturedMedia,
        featuredLinks: currentFeaturedLinks,
      },
      artist,
    );
    if (!readiness.ready) {
      throw new BadRequestException(
        `Add the required EPK content before publishing: ${readiness.missing.join(', ')}.`,
      );
    }

    const publishSnapshot = buildPublishedEpkSnapshot(
      {
        headline: epk.headline,
        shortBio: epk.shortBio,
        fullBio: epk.fullBio,
        bookingEmail: epk.bookingEmail,
        managementContact: epk.managementContact,
        pressContact: epk.pressContact,
        heroImageUrl: epk.heroImageUrl,
        galleryImageUrls: currentGalleryImageUrls,
        featuredMedia: currentFeaturedMedia,
        featuredLinks: currentFeaturedLinks,
      },
      artist,
    );
    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: {
        isPublished: true,
        shortBio: publishSnapshot.shortBio,
        heroImageUrl: publishSnapshot.heroImageUrl,
        featuredLinks: publishSnapshot.featuredLinks as unknown as Prisma.InputJsonValue,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.publish',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { artistId },
      ipAddress,
    });

    return {
      epk: mapEpk(updated),
      inherited: mapInheritedArtist(artist),
    };
  }

  async unpublish(
    artistId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'epk_builder');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: { isPublished: false },
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.unpublish',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { artistId },
      ipAddress,
    });

    return {
      epk: mapEpk(updated),
      inherited: mapInheritedArtist(artist),
    };
  }

  private async ensureEpkRecord(artistId: string): Promise<EpkRecord> {
    return this.prisma.epk.upsert({
      where: { artistId },
      update: {},
      create: { artistId },
    });
  }

  private buildUpdatePayload(dto: UpdateEpkDto): Prisma.EpkUpdateInput {
    const payload: UpdateEpkPayload = {
      ...(dto.headline !== undefined && { headline: dto.headline }),
      ...(dto.shortBio !== undefined && { shortBio: dto.shortBio }),
      ...(dto.fullBio !== undefined && { fullBio: dto.fullBio }),
      ...(dto.pressQuote !== undefined && { pressQuote: dto.pressQuote }),
      ...(dto.bookingEmail !== undefined && { bookingEmail: dto.bookingEmail }),
      ...(dto.managementContact !== undefined && { managementContact: dto.managementContact }),
      ...(dto.pressContact !== undefined && { pressContact: dto.pressContact }),
      ...(dto.heroImageUrl !== undefined && { heroImageUrl: dto.heroImageUrl }),
      ...(dto.galleryImageUrls !== undefined && {
        galleryImageUrls: sanitizeStringArray(dto.galleryImageUrls) ?? [],
      }),
      ...(dto.featuredMedia !== undefined && { featuredMedia: dto.featuredMedia }),
      ...(dto.featuredLinks !== undefined && { featuredLinks: dto.featuredLinks }),
      ...(dto.highlights !== undefined && {
        highlights: sanitizeStringArray(dto.highlights) ?? [],
      }),
      ...(dto.riderInfo !== undefined && { riderInfo: dto.riderInfo }),
      ...(dto.techRequirements !== undefined && { techRequirements: dto.techRequirements }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.availabilityNotes !== undefined && { availabilityNotes: dto.availabilityNotes }),
    };

    return {
      ...(payload.headline !== undefined && { headline: payload.headline }),
      ...(payload.shortBio !== undefined && { shortBio: payload.shortBio }),
      ...(payload.fullBio !== undefined && { fullBio: payload.fullBio }),
      ...(payload.pressQuote !== undefined && { pressQuote: payload.pressQuote }),
      ...(payload.bookingEmail !== undefined && { bookingEmail: payload.bookingEmail }),
      ...(payload.managementContact !== undefined && {
        managementContact: payload.managementContact,
      }),
      ...(payload.pressContact !== undefined && { pressContact: payload.pressContact }),
      ...(payload.heroImageUrl !== undefined && { heroImageUrl: payload.heroImageUrl }),
      ...(payload.galleryImageUrls !== undefined && {
        galleryImageUrls: payload.galleryImageUrls as Prisma.InputJsonValue,
      }),
      ...(payload.featuredMedia !== undefined && {
        featuredMedia: payload.featuredMedia as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.featuredLinks !== undefined && {
        featuredLinks: payload.featuredLinks as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.highlights !== undefined && {
        highlights: payload.highlights as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.riderInfo !== undefined && { riderInfo: payload.riderInfo }),
      ...(payload.techRequirements !== undefined && {
        techRequirements: payload.techRequirements,
      }),
      ...(payload.location !== undefined && { location: payload.location }),
      ...(payload.availabilityNotes !== undefined && {
        availabilityNotes: payload.availabilityNotes,
      }),
    };
  }
}
