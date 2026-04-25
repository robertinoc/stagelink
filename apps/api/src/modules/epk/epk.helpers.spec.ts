import { buildPublishedEpkSnapshot, normalizeFeaturedLinks } from './epk.helpers';

describe('epk.helpers', () => {
  it('dedupes featured links by url while preserving first occurrence', () => {
    expect(
      normalizeFeaturedLinks([
        { id: '1', label: 'Spotify', url: 'https://spotify.com/a' },
        { id: '2', label: 'YouTube', url: 'https://youtube.com/a' },
        { id: '3', label: 'Spotify again', url: 'https://spotify.com/a' },
      ]),
    ).toEqual([
      { id: '1', label: 'Spotify', url: 'https://spotify.com/a' },
      { id: '2', label: 'YouTube', url: 'https://youtube.com/a' },
    ]);
  });

  it('normalizes published snapshot featured links before returning them', () => {
    const snapshot = buildPublishedEpkSnapshot(
      {
        headline: 'Headline',
        shortBio: 'Short bio',
        fullBio: 'Full bio',
        bookingEmail: 'booking@example.com',
        managementContact: null,
        pressContact: null,
        heroImageUrl: null,
        galleryImageUrls: [],
        featuredMedia: [],
        featuredLinks: [
          { id: '1', label: 'SoundCloud', url: 'https://soundcloud.com/a' },
          { id: '2', label: 'Spotify', url: 'https://spotify.com/a' },
          { id: '3', label: 'Spotify duplicate', url: 'https://spotify.com/a' },
          { id: '4', label: 'Instagram', url: 'https://instagram.com/a' },
        ],
      },
      {
        bio: 'Artist bio',
        coverUrl: null,
        avatarUrl: null,
        instagramUrl: 'https://instagram.com/a',
        tiktokUrl: null,
        youtubeUrl: null,
        spotifyUrl: 'https://spotify.com/a',
        soundcloudUrl: 'https://soundcloud.com/a',
        websiteUrl: 'https://example.com',
      },
    );

    expect(snapshot.featuredLinks).toEqual([
      { id: '1', label: 'SoundCloud', url: 'https://soundcloud.com/a' },
      { id: '2', label: 'Spotify', url: 'https://spotify.com/a' },
      { id: '4', label: 'Instagram', url: 'https://instagram.com/a' },
    ]);
  });
});
