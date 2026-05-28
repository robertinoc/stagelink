import { NotFoundException } from '@nestjs/common';
import { PublicEpkService } from './public-epk.service';

describe('PublicEpkService', () => {
  function createService() {
    const prisma = {
      epk: {
        findUnique: jest.fn(),
      },
    };

    const tenantResolver = {
      resolveByUsername: jest.fn(),
    };

    const service = new PublicEpkService(prisma as never, tenantResolver as never);

    return { service, prisma, tenantResolver };
  }

  /** Minimal valid EPK row with all required fields */
  function makeEpkRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'epk_123',
      isPublished: true,
      headline: 'Bio del press kit',
      shortBio: null,
      fullBio: null,
      pressQuote: null,
      baseLocale: 'es',
      translations: {
        headline: { en: 'Press kit headline' },
      },
      bookingEmail: null,
      managementContact: null,
      pressContact: null,
      heroImageUrl: null,
      galleryImageUrls: [],
      featuredMedia: [],
      featuredLinks: [],
      highlights: [],
      riderInfo: null,
      techRequirements: null,
      location: null,
      availabilityNotes: null,
      templateId: 'studio',
      brand: null,
      artist: {
        id: 'artist_123',
        username: 'robertinoc',
        displayName: 'Robertino',
        bio: 'Bio base en espanol',
        fullBio: null,
        baseLocale: 'es',
        translations: {
          bio: { en: 'English artist bio' },
          displayName: { en: 'Robertino' },
        },
        avatarUrl: null,
        coverUrl: null,
        websiteUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        youtubeUrl: null,
        spotifyUrl: null,
        soundcloudUrl: null,
        appleMusicUrl: null,
        amazonMusicUrl: null,
        deezerUrl: null,
        tidalUrl: null,
        beatportUrl: null,
        traxsourceUrl: null,
        recordLabels: [],
        epsReleasedCount: null,
        externalCollabsCount: null,
      },
      ...overrides,
    };
  }

  it('uses artist bio translations as effective short bio when epk short bio is empty', async () => {
    const { service, prisma, tenantResolver } = createService();

    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });
    prisma.epk.findUnique.mockResolvedValue(makeEpkRow());

    const result = await service.getPublishedByUsername('robertinoc', 'en');

    expect(result.shortBio).toBe('English artist bio');
    expect(result.contentLocale).toBe('en');
  });

  it('returns not found when artist does not exist', async () => {
    const { service, tenantResolver } = createService();

    tenantResolver.resolveByUsername.mockResolvedValue(null);

    await expect(service.getPublishedByUsername('unknown', 'en')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // ─── PR #417 / #418 — templateId + brand ─────────────────────────────────

  it('returns templateId from the database when it is a valid EpkTemplateId', async () => {
    const { service, prisma, tenantResolver } = createService();
    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });

    for (const templateId of ['studio', 'cinematic', 'brutalist'] as const) {
      prisma.epk.findUnique.mockResolvedValue(makeEpkRow({ templateId }));
      const result = await service.getPublishedByUsername('robertinoc', 'en');
      expect(result.templateId).toBe(templateId);
    }
  });

  it('falls back to "studio" templateId when DB value is null or unknown', async () => {
    const { service, prisma, tenantResolver } = createService();
    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });

    for (const badValue of [null, undefined, 'legacy_template', '']) {
      prisma.epk.findUnique.mockResolvedValue(makeEpkRow({ templateId: badValue }));
      const result = await service.getPublishedByUsername('robertinoc', 'en');
      expect(result.templateId).toBe('studio');
    }
  });

  it('returns brand object when set in the database', async () => {
    const { service, prisma, tenantResolver } = createService();
    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });

    const brand = {
      primary: '#E040FB',
      secondary: '#9B30D0',
      bg: '#0D0018',
      ink: '#FFFFFF',
      id: 'neon',
      name: 'Neon',
    };
    prisma.epk.findUnique.mockResolvedValue(makeEpkRow({ templateId: 'brutalist', brand }));
    const result = await service.getPublishedByUsername('robertinoc', 'en');

    expect(result.brand).toEqual(brand);
  });

  it('returns null brand when not set in the database', async () => {
    const { service, prisma, tenantResolver } = createService();
    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });

    prisma.epk.findUnique.mockResolvedValue(makeEpkRow({ brand: null }));
    const result = await service.getPublishedByUsername('robertinoc', 'en');

    expect(result.brand).toBeNull();
  });

  it('returns all 12 artist link URLs in the artist object', async () => {
    const { service, prisma, tenantResolver } = createService();
    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });

    const artistLinks = {
      instagramUrl: 'https://instagram.com/test',
      youtubeUrl: 'https://youtube.com/test',
      spotifyUrl: 'https://spotify.com/test',
      appleMusicUrl: 'https://music.apple.com/test',
      soundcloudUrl: 'https://soundcloud.com/test',
      amazonMusicUrl: 'https://music.amazon.com/test',
      deezerUrl: 'https://deezer.com/test',
      tidalUrl: 'https://tidal.com/test',
      beatportUrl: 'https://beatport.com/test',
      traxsourceUrl: 'https://traxsource.com/test',
      websiteUrl: 'https://example.com',
      tiktokUrl: 'https://tiktok.com/@test',
    };
    const artistRow = {
      ...makeEpkRow().artist,
      ...artistLinks,
    };
    prisma.epk.findUnique.mockResolvedValue(makeEpkRow({ artist: artistRow }));

    const result = await service.getPublishedByUsername('robertinoc', 'en');

    for (const [key, url] of Object.entries(artistLinks)) {
      expect((result.artist as unknown as Record<string, unknown>)[key]).toBe(url);
    }
  });
});
