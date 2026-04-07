import type {
  EpkFeaturedLinkItem,
  EpkFeaturedMediaItem,
  PublicEpkArtist,
  PublicEpkResponse,
} from '@stagelink/types';

export interface PublicEpkArtistDto extends PublicEpkArtist {}

export interface PublicEpkResponseDto extends PublicEpkResponse {
  artist: PublicEpkArtistDto;
  galleryImageUrls: string[];
  featuredMedia: EpkFeaturedMediaItem[];
  featuredLinks: EpkFeaturedLinkItem[];
  highlights: string[];
}
