import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  EPK_TEMPLATE_IDS,
  type EpkBrand,
  type EpkFeaturedLinkItem,
  type EpkFeaturedMediaItem,
  type EpkTemplateId,
  type EpkTranslations,
  type RecordLabel,
  type SupportedLocale,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import type { PublicEpkResponseDto } from './dto/public-epk-response.dto';
import { buildFallbackFeaturedLinks, normalizeFeaturedLinks } from '../epk/epk.helpers';
import {
  normalizeBaseLocale,
  resolveFieldLevelLocalizedText,
} from '../../common/utils/localized-content.util';

@Injectable()
export class PublicEpkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantResolver: TenantResolverService,
  ) {}

  async getPublishedByUsername(
    username: string,
    locale: SupportedLocale,
  ): Promise<PublicEpkResponseDto> {
    const tenant = await this.tenantResolver.resolveByUsername(username);
    if (!tenant) throw new NotFoundException('Artist not found');

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
        templateId: true,
        brand: true,
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            fullBio: true,
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
            appleMusicUrl: true,
            amazonMusicUrl: true,
            deezerUrl: true,
            tidalUrl: true,
            beatportUrl: true,
            traxsourceUrl: true,
            recordLabels: true,
            epsReleasedCount: true,
            externalCollabsCount: true,
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
    // When the EPK has its own shortBio, use its translations; otherwise fall back to
    // the artist's own bio translations (same as the old document-locale logic).
    const effectiveShortBioTranslations = epk.shortBio?.trim()
      ? epkTranslations.shortBio
      : artistTranslations.bio;

    // Field-level locale resolution: each field independently resolves the best
    // available text for the requested locale, falling back to DEFAULT_LOCALE
    // translations → baseValue — instead of forcing the whole document to a single
    // locale when any one required field is missing a translation.
    return {
      artistId: artist.id,
      epkId: epk.id,
      isPublished: epk.isPublished,
      baseLocale,
      artist: {
        username: artist.username,
        displayName:
          resolveFieldLevelLocalizedText(
            artist.displayName,
            artistTranslations.displayName,
            locale,
          ) ?? artist.displayName,
        bio: resolveFieldLevelLocalizedText(artist.bio, artistTranslations.bio, locale),
        avatarUrl: artist.avatarUrl,
        coverUrl: artist.coverUrl,
        websiteUrl: artist.websiteUrl,
        instagramUrl: artist.instagramUrl,
        tiktokUrl: artist.tiktokUrl,
        youtubeUrl: artist.youtubeUrl,
        spotifyUrl: artist.spotifyUrl,
        soundcloudUrl: artist.soundcloudUrl,
        appleMusicUrl: artist.appleMusicUrl,
        amazonMusicUrl: artist.amazonMusicUrl,
        deezerUrl: artist.deezerUrl,
        tidalUrl: artist.tidalUrl,
        beatportUrl: artist.beatportUrl,
        traxsourceUrl: artist.traxsourceUrl,
      },
      headline: resolveFieldLevelLocalizedText(epk.headline, epkTranslations.headline, locale),
      shortBio:
        resolveFieldLevelLocalizedText(baseShortBio, effectiveShortBioTranslations, locale) ??
        resolveFieldLevelLocalizedText(artist.bio, artistTranslations.bio, locale),
      // Fallback chain for fullBio:
      // 1. EPK's own fullBio (override, field-level resolved)
      // 2. Artist's fullBio from My Profile (untranslated plain text)
      // 3. Artist's short bio (last resort if no full bio set anywhere)
      fullBio:
        resolveFieldLevelLocalizedText(epk.fullBio, epkTranslations.fullBio, locale) ??
        artist.fullBio ??
        resolveFieldLevelLocalizedText(artist.bio, artistTranslations.bio, locale),
      pressQuote: resolveFieldLevelLocalizedText(
        epk.pressQuote,
        epkTranslations.pressQuote,
        locale,
      ),
      bookingEmail: epk.bookingEmail,
      managementContact: epk.managementContact,
      pressContact: epk.pressContact,
      heroImageUrl: epk.heroImageUrl ?? artist.coverUrl ?? artist.avatarUrl,
      galleryImageUrls: (epk.galleryImageUrls as unknown as string[]).filter(Boolean),
      featuredMedia: (epk.featuredMedia as unknown as EpkFeaturedMediaItem[]).filter(Boolean),
      featuredLinks: featuredLinks.length > 0 ? featuredLinks : fallbackFeaturedLinks,
      highlights: (epk.highlights as unknown as string[]).filter(Boolean),
      riderInfo: resolveFieldLevelLocalizedText(epk.riderInfo, epkTranslations.riderInfo, locale),
      techRequirements: resolveFieldLevelLocalizedText(
        epk.techRequirements,
        epkTranslations.techRequirements,
        locale,
      ),
      location: epk.location,
      availabilityNotes: resolveFieldLevelLocalizedText(
        epk.availabilityNotes,
        epkTranslations.availabilityNotes,
        locale,
      ),
      recordLabels: (artist.recordLabels as unknown as RecordLabel[]) ?? [],
      // REQ-11 counters
      epsReleasedCount: artist.epsReleasedCount ?? null,
      externalCollabsCount: artist.externalCollabsCount ?? null,
      recordLabelsCount: ((artist.recordLabels as unknown as RecordLabel[]) ?? []).length,
      locale,
      // With field-level resolution there is no single "content locale" for the whole
      // document — each field resolved independently. We report the requested locale so
      // callers know what was asked for; individual fields carry their own fallback transparently.
      contentLocale: locale,
      templateId: (EPK_TEMPLATE_IDS as readonly string[]).includes(epk.templateId)
        ? (epk.templateId as EpkTemplateId)
        : 'studio',
      brand: (epk.brand as EpkBrand | null) ?? null,
    };
  }
}
