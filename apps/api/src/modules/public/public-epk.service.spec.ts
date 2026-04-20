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

    const billingEntitlementsService = {
      hasFeatureAccess: jest.fn(),
    };

    const service = new PublicEpkService(
      prisma as never,
      tenantResolver as never,
      billingEntitlementsService as never,
    );

    return { service, prisma, tenantResolver, billingEntitlementsService };
  }

  it('uses artist bio translations as effective short bio when epk short bio is empty', async () => {
    const { service, prisma, tenantResolver, billingEntitlementsService } = createService();

    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });
    billingEntitlementsService.hasFeatureAccess.mockResolvedValue(true);
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
      },
    });

    const result = await service.getPublishedByUsername('robertinoc', 'en');

    expect(result.shortBio).toBe('English artist bio');
    expect(result.contentLocale).toBe('en');
  });

  it('returns not found when epk_builder is not available for the artist', async () => {
    const { service, tenantResolver, billingEntitlementsService } = createService();

    tenantResolver.resolveByUsername.mockResolvedValue({ artistId: 'artist_123' });
    billingEntitlementsService.hasFeatureAccess.mockResolvedValue(false);

    await expect(service.getPublishedByUsername('robertinoc', 'en')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
