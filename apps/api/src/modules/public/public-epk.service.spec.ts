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

  it('uses artist bio translations as effective short bio when epk short bio is empty', async () => {
    const { service, prisma, tenantResolver } = createService();

    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });
    prisma.epk.findUnique.mockResolvedValue({
      id: 'epk_123',
      isPublished: true,
      headline: 'Bio del press kit',
      shortBio: null,
      fullBio: null,
      pressQuote: null,
      baseLocale: 'es',
      translations: {
        headline: {
          en: 'Press kit headline',
        },
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
      artist: {
        id: 'artist_123',
        username: 'robertinoc',
        displayName: 'Robertino',
        bio: 'Bio base en espanol',
        fullBio: null,
        baseLocale: 'es',
        translations: {
          bio: {
            en: 'English artist bio',
          },
          displayName: {
            en: 'Robertino',
          },
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
    });

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
});
