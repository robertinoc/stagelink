import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  type EpkFeaturedLinkItem,
  type EpkFeaturedMediaItem,
  type EpkTranslations,
  type SupportedLocale,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import type { PublicEpkResponseDto } from './dto/public-epk-response.dto';
import { buildFallbackFeaturedLinks, normalizeFeaturedLinks } from '../epk/epk.helpers';
import {
  normalizeBaseLocale,
  resolveDocumentLocale,
  resolveDocumentText,
} from '../../common/utils/localized-content.util';

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
        baseLocale: true,
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
        recordLabels: true,
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            baseLocale: true,
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
    const featuredLinks = normalizeFeaturedLinks(
      (epk.featuredLinks as unknown as EpkFeaturedLinkItem[]).filter(Boolean),
    );
    const fallbackFeaturedLinks = normalizeFeaturedLinks(buildFallbackFeaturedLinks(artist));
    const baseLocale = normalizeBaseLocale(epk.baseLocale ?? artist.baseLocale ?? DEFAULT_LOCALE);
    const baseShortBio = epk.shortBio ?? artist.bio;
    const effectiveShortBioTranslations = epk.shortBio?.trim()
      ? epkTranslations.shortBio
      : artistTranslations.bio;
    const contentLocale = resolveDocumentLocale(locale, baseLocale, [
      { baseValue: artist.displayName, localizedValue: artistTranslations.displayName },
      { baseValue: baseShortBio, localizedValue: effectiveShortBioTranslations },
      { baseValue: epk.headline, localizedValue: epkTranslations.headline },
      { baseValue: epk.fullBio, localizedValue: epkTranslations.fullBio },
      {
        baseValue: epk.pressQuote,
        localizedValue: epkTranslations.pressQuote,
        required: false,
      },
      {
        baseValue: epk.riderInfo,
        localizedValue: epkTranslations.riderInfo,
        required: false,
      },
      {
        baseValue: epk.techRequirements,
        localizedValue: epkTranslations.techRequirements,
        required: false,
      },
      {
        baseValue: epk.availabilityNotes,
        localizedValue: epkTranslations.availabilityNotes,
        required: false,
      },
    ]);

    return {
      artistId: artist.id,
      epkId: epk.id,
      isPublished: epk.isPublished,
      baseLocale,
      artist: {
        username: artist.username,
        displayName:
          resolveDocumentText(
            artist.displayName,
            artistTranslations.displayName,
            contentLocale,
            artist.baseLocale ?? baseLocale,
          ) ?? artist.displayName,
        bio: resolveDocumentText(
          artist.bio,
          artistTranslations.bio,
          contentLocale,
          artist.baseLocale ?? baseLocale,
        ),
        avatarUrl: artist.avatarUrl,
        coverUrl: artist.coverUrl,
        websiteUrl: artist.websiteUrl,
        instagramUrl: artist.instagramUrl,
        tiktokUrl: artist.tiktokUrl,
        youtubeUrl: artist.youtubeUrl,
        spotifyUrl: artist.spotifyUrl,
        soundcloudUrl: artist.soundcloudUrl,
      },
      headline: resolveDocumentText(
        epk.headline,
        epkTranslations.headline,
        contentLocale,
        baseLocale,
      ),
      shortBio:
        resolveDocumentText(
          baseShortBio,
          effectiveShortBioTranslations,
          contentLocale,
          baseLocale,
        ) ??
        resolveDocumentText(
          artist.bio,
          artistTranslations.bio,
          contentLocale,
          artist.baseLocale ?? baseLocale,
        ),
      fullBio: resolveDocumentText(epk.fullBio, epkTranslations.fullBio, contentLocale, baseLocale),
      pressQuote: resolveDocumentText(
        epk.pressQuote,
        epkTranslations.pressQuote,
        contentLocale,
        baseLocale,
      ),
      bookingEmail: epk.bookingEmail,
      managementContact: epk.managementContact,
      pressContact: epk.pressContact,
      heroImageUrl: epk.heroImageUrl ?? artist.coverUrl ?? artist.avatarUrl,
      galleryImageUrls: (epk.galleryImageUrls as unknown as string[]).filter(Boolean),
      featuredMedia: (epk.featuredMedia as unknown as EpkFeaturedMediaItem[]).filter(Boolean),
      featuredLinks: featuredLinks.length > 0 ? featuredLinks : fallbackFeaturedLinks,
      highlights: (epk.highlights as unknown as string[]).filter(Boolean),
      riderInfo: resolveDocumentText(
        epk.riderInfo,
        epkTranslations.riderInfo,
        contentLocale,
        baseLocale,
      ),
      techRequirements: resolveDocumentText(
        epk.techRequirements,
        epkTranslations.techRequirements,
        contentLocale,
        baseLocale,
      ),
      location: epk.location,
      availabilityNotes: resolveDocumentText(
        epk.availabilityNotes,
        epkTranslations.availabilityNotes,
        contentLocale,
        baseLocale,
      ),
      recordLabels: epk.recordLabels,
      locale,
      contentLocale,
    };
  }
}
