import { Injectable, NotFoundException } from '@nestjs/common';
import type { EpkFeaturedLinkItem, EpkFeaturedMediaItem } from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import type { PublicEpkResponseDto } from './dto/public-epk-response.dto';
import { buildFallbackFeaturedLinks } from '../epk/epk.helpers';

@Injectable()
export class PublicEpkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantResolver: TenantResolverService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
  ) {}

  async getPublishedByUsername(username: string): Promise<PublicEpkResponseDto> {
    const tenant = await this.tenantResolver.resolveByUsername(username);
    if (!tenant) throw new NotFoundException('Artist not found');

    const hasFeature = await this.billingEntitlementsService.hasFeatureAccess(
      tenant.artistId,
      'epk_builder',
    );
    if (!hasFeature) throw new NotFoundException('EPK not found');

    const epk = await this.prisma.epk.findUnique({
      where: { artistId: tenant.artistId },
      select: {
        id: true,
        isPublished: true,
        headline: true,
        shortBio: true,
        fullBio: true,
        pressQuote: true,
        bookingEmail: true,
        managementContact: true,
        pressContact: true,
        heroImageUrl: true,
        galleryImageUrls: true,
        featuredMedia: true,
        featuredLinks: true,
        highlights: true,
        riderInfo: true,
        techRequirements: true,
        location: true,
        availabilityNotes: true,
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            websiteUrl: true,
            instagramUrl: true,
            tiktokUrl: true,
            youtubeUrl: true,
            spotifyUrl: true,
            soundcloudUrl: true,
          },
        },
      },
    });

    if (!epk || !epk.isPublished) {
      throw new NotFoundException('EPK not found');
    }

    const artist = epk.artist;
    const featuredLinks = (epk.featuredLinks as unknown as EpkFeaturedLinkItem[]).filter(Boolean);
    const fallbackFeaturedLinks = buildFallbackFeaturedLinks(artist);

    return {
      artistId: artist.id,
      epkId: epk.id,
      isPublished: epk.isPublished,
      artist: {
        username: artist.username,
        displayName: artist.displayName,
        bio: artist.bio,
        avatarUrl: artist.avatarUrl,
        coverUrl: artist.coverUrl,
        websiteUrl: artist.websiteUrl,
        instagramUrl: artist.instagramUrl,
        tiktokUrl: artist.tiktokUrl,
        youtubeUrl: artist.youtubeUrl,
        spotifyUrl: artist.spotifyUrl,
        soundcloudUrl: artist.soundcloudUrl,
      },
      headline: epk.headline,
      shortBio: epk.shortBio ?? artist.bio,
      fullBio: epk.fullBio,
      pressQuote: epk.pressQuote,
      bookingEmail: epk.bookingEmail,
      managementContact: epk.managementContact,
      pressContact: epk.pressContact,
      heroImageUrl: epk.heroImageUrl ?? artist.coverUrl ?? artist.avatarUrl,
      galleryImageUrls: (epk.galleryImageUrls as unknown as string[]).filter(Boolean),
      featuredMedia: (epk.featuredMedia as unknown as EpkFeaturedMediaItem[]).filter(Boolean),
      featuredLinks: featuredLinks.length > 0 ? featuredLinks : fallbackFeaturedLinks,
      highlights: (epk.highlights as unknown as string[]).filter(Boolean),
      riderInfo: epk.riderInfo,
      techRequirements: epk.techRequirements,
      location: epk.location,
      availabilityNotes: epk.availabilityNotes,
    };
  }
}
