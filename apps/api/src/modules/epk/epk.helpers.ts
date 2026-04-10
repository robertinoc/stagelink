import type { Artist } from '@prisma/client';
import type {
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  EpkPublishReadiness,
} from '@stagelink/types';
import { getEpkPublishReadiness } from '@stagelink/types';

interface ArtistLinkSource {
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
  websiteUrl: string | null;
}

interface EpkPublishSnapshotInput {
  headline: string | null;
  shortBio: string | null;
  fullBio: string | null;
  bookingEmail: string | null;
  managementContact: string | null;
  pressContact: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  featuredMedia: EpkFeaturedMediaItem[];
  featuredLinks: EpkFeaturedLinkItem[];
}

function trimNullable(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildFallbackFeaturedLinks(artist: ArtistLinkSource): EpkFeaturedLinkItem[] {
  const entries = [
    artist.websiteUrl && { id: 'website', label: 'Website', url: artist.websiteUrl },
    artist.instagramUrl && { id: 'instagram', label: 'Instagram', url: artist.instagramUrl },
    artist.tiktokUrl && { id: 'tiktok', label: 'TikTok', url: artist.tiktokUrl },
    artist.youtubeUrl && { id: 'youtube', label: 'YouTube', url: artist.youtubeUrl },
    artist.spotifyUrl && { id: 'spotify', label: 'Spotify', url: artist.spotifyUrl },
    artist.soundcloudUrl && { id: 'soundcloud', label: 'SoundCloud', url: artist.soundcloudUrl },
  ];

  return entries.filter((item): item is EpkFeaturedLinkItem => Boolean(item));
}

export function getEpkPublishValidation(
  epk: EpkPublishSnapshotInput,
  _artist: Pick<Artist, 'bio'>,
): EpkPublishReadiness {
  return getEpkPublishReadiness({
    headline: epk.headline,
    shortBio: epk.shortBio,
    fullBio: epk.fullBio,
    featuredMedia: epk.featuredMedia,
    galleryImageUrls: epk.galleryImageUrls,
    bookingEmail: epk.bookingEmail,
    managementContact: epk.managementContact,
    pressContact: epk.pressContact,
  });
}

export function buildPublishedEpkSnapshot(
  epk: EpkPublishSnapshotInput,
  artist: Pick<
    Artist,
    | 'bio'
    | 'coverUrl'
    | 'avatarUrl'
    | 'instagramUrl'
    | 'tiktokUrl'
    | 'youtubeUrl'
    | 'spotifyUrl'
    | 'soundcloudUrl'
    | 'websiteUrl'
  >,
) {
  const shortBio = trimNullable(epk.shortBio) ?? trimNullable(artist.bio);
  const heroImageUrl =
    trimNullable(epk.heroImageUrl) ??
    trimNullable(artist.coverUrl) ??
    trimNullable(artist.avatarUrl);
  const featuredLinks =
    epk.featuredLinks.length > 0 ? epk.featuredLinks : buildFallbackFeaturedLinks(artist);

  return {
    shortBio,
    heroImageUrl,
    featuredLinks,
  };
}
