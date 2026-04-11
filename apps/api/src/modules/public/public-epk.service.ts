import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  EpkTranslations,
  SupportedLocale,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import type { PublicEpkResponseDto } from './dto/public-epk-response.dto';
import { buildFallbackFeaturedLinks } from '../epk/epk.helpers';
import { resolveLocalizedText } from '../../common/utils/localized-content.util';

@Injectable()
export class PublicEpkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantResolver: TenantResolverService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
  ) {}

  async getPublishedByUsername(
    username: string,
    locale: SupportedLocale,
  ): Promise<PublicEpkResponseDto> {
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
        translations: true,
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
            translations: true,
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
    const epkTranslations = (epk.translations as EpkTranslations | null) ?? {};
    const artistTranslations =
      (artist.translations as {
        bio?: Record<string, string>;
        displayName?: Record<string, string>;
      } | null) ?? {};
    const featuredLinks = (epk.featuredLinks as unknown as EpkFeaturedLinkItem[]).filter(Boolean);
    const fallbackFeaturedLinks = buildFallbackFeaturedLinks(artist);

    return {
      artistId: artist.id,
      epkId: epk.id,
      isPublished: epk.isPublished,
      artist: {
        username: artist.username,
        displayName:
          resolveLocalizedText(artist.displayName, artistTranslations.displayName, locale) ??
          artist.displayName,
        bio: resolveLocalizedText(artist.bio, artistTranslations.bio, locale),
        avatarUrl: artist.avatarUrl,
        coverUrl: artist.coverUrl,
        websiteUrl: artist.websiteUrl,
        instagramUrl: artist.instagramUrl,
        tiktokUrl: artist.tiktokUrl,
        youtubeUrl: artist.youtubeUrl,
        spotifyUrl: artist.spotifyUrl,
        soundcloudUrl: artist.soundcloudUrl,
      },
      headline: resolveLocalizedText(epk.headline, epkTranslations.headline, locale),
      shortBio:
        resolveLocalizedText(epk.shortBio, epkTranslations.shortBio, locale) ??
        resolveLocalizedText(artist.bio, artistTranslations.bio, locale),
      fullBio: resolveLocalizedText(epk.fullBio, epkTranslations.fullBio, locale),
      pressQuote: resolveLocalizedText(epk.pressQuote, epkTranslations.pressQuote, locale),
      bookingEmail: epk.bookingEmail,
      managementContact: epk.managementContact,
      pressContact: epk.pressContact,
      heroImageUrl: epk.heroImageUrl ?? artist.coverUrl ?? artist.avatarUrl,
      galleryImageUrls: (epk.galleryImageUrls as unknown as string[]).filter(Boolean),
      featuredMedia: (epk.featuredMedia as unknown as EpkFeaturedMediaItem[]).filter(Boolean),
      featuredLinks: featuredLinks.length > 0 ? featuredLinks : fallbackFeaturedLinks,
      highlights: (epk.highlights as unknown as string[]).filter(Boolean),
      riderInfo: resolveLocalizedText(epk.riderInfo, epkTranslations.riderInfo, locale),
      techRequirements: resolveLocalizedText(
        epk.techRequirements,
        epkTranslations.techRequirements,
        locale,
      ),
      location: epk.location,
      availabilityNotes: resolveLocalizedText(
        epk.availabilityNotes,
        epkTranslations.availabilityNotes,
        locale,
      ),
      locale,
    };
  }
}
