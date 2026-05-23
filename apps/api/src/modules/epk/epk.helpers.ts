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
  appleMusicUrl: string | null;
  amazonMusicUrl: string | null;
  deezerUrl: string | null;
  tidalUrl: string | null;
  beatportUrl: string | null;
  traxsourceUrl: string | null;
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

export function normalizeFeaturedLinks(items: EpkFeaturedLinkItem[]): EpkFeaturedLinkItem[] {
  const seen = new Set<string>();

  return items
    .map((item) => ({
      ...item,
      label: item.label.trim(),
      url: item.url.trim(),
    }))
    .filter((item) => {
      if (!item.label || !item.url || seen.has(item.url)) {
        return false;
      }

      seen.add(item.url);
      return true;
    });
}

export function buildFallbackFeaturedLinks(artist: ArtistLinkSource): EpkFeaturedLinkItem[] {
  const entries = [
    artist.spotifyUrl && { id: 'spotify', label: 'Spotify', url: artist.spotifyUrl },
    artist.appleMusicUrl && {
      id: 'apple-music',
      label: 'Apple Music',
      url: artist.appleMusicUrl,
    },
    artist.youtubeUrl && { id: 'youtube', label: 'YouTube', url: artist.youtubeUrl },
    artist.soundcloudUrl && { id: 'soundcloud', label: 'SoundCloud', url: artist.soundcloudUrl },
    artist.instagramUrl && { id: 'instagram', label: 'Instagram', url: artist.instagramUrl },
    artist.tiktokUrl && { id: 'tiktok', label: 'TikTok', url: artist.tiktokUrl },
    artist.amazonMusicUrl && {
      id: 'amazon-music',
      label: 'Amazon Music',
      url: artist.amazonMusicUrl,
    },
    artist.deezerUrl && { id: 'deezer', label: 'Deezer', url: artist.deezerUrl },
    artist.tidalUrl && { id: 'tidal', label: 'Tidal', url: artist.tidalUrl },
    artist.beatportUrl && { id: 'beatport', label: 'Beatport', url: artist.beatportUrl },
    artist.traxsourceUrl && { id: 'traxsource', label: 'Traxsource', url: artist.traxsourceUrl },
    artist.websiteUrl && { id: 'website', label: 'Website', url: artist.websiteUrl },
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
    | 'appleMusicUrl'
    | 'amazonMusicUrl'
    | 'deezerUrl'
    | 'tidalUrl'
    | 'beatportUrl'
    | 'traxsourceUrl'
  >,
) {
  const shortBio = trimNullable(epk.shortBio) ?? trimNullable(artist.bio);
  const heroImageUrl =
    trimNullable(epk.heroImageUrl) ??
    trimNullable(artist.coverUrl) ??
    trimNullable(artist.avatarUrl);
  const featuredLinks = normalizeFeaturedLinks(
    epk.featuredLinks.length > 0 ? epk.featuredLinks : buildFallbackFeaturedLinks(artist),
  );

  return {
    shortBio,
    heroImageUrl,
    featuredLinks,
  };
}
