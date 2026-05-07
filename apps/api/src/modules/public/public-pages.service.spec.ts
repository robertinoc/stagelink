/**
 * PublicPagesService — smoke tests
 *
 * Verifies the critical happy path and key error paths for the public page
 * resolution pipeline. Uses the same mock pattern as the rest of the codebase:
 *   const prisma = { model: { method: jest.fn() } };
 *   const service = new Service(prisma as never, ...);
 *
 * These tests guard against regressions in:
 *   - Artist page resolution by username (the core public URL)
 *   - NotFoundException for unknown artists / missing pages
 *   - PRO+ feature gating (branding slot)
 *   - Analytics event fire-and-forget (non-blocking failures)
 *   - EPK availability flag
 */

import { NotFoundException } from '@nestjs/common';
import { PublicPagesService } from './public-pages.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal published block (links type) for response shape assertions. */
const LINKS_BLOCK = {
  id: 'block-links-1',
  type: 'links' as const,
  title: 'Links',
  position: 0,
  config: {
    items: [
      {
        id: 'item-1',
        label: 'Spotify',
        url: 'https://open.spotify.com/artist/example',
        isActive: true,
      },
    ],
  },
  localizedContent: {},
};

/** Minimal artist row returned by prisma.page.findUnique. */
function makeArtistRow(overrides: Record<string, unknown> = {}) {
  return {
    username: 'test-artist',
    displayName: 'Test Artist',
    bio: 'A test artist.',
    avatarUrl: null,
    coverUrl: null,
    category: 'musician',
    secondaryCategories: [],
    tags: [],
    instagramUrl: null,
    tiktokUrl: null,
    youtubeUrl: null,
    spotifyUrl: null,
    soundcloudUrl: null,
    websiteUrl: null,
    contactEmail: null,
    seoTitle: null,
    seoDescription: null,
    baseLocale: 'en',
    translations: {},
    epk: null,
    subscription: null,
    ...overrides,
  };
}

/** Minimal page row returned by prisma.page.findUnique. */
function makePageRow(artistOverrides: Record<string, unknown> = {}, blocks = [LINKS_BLOCK]) {
  return {
    id: 'page-1',
    artist: makeArtistRow(artistOverrides),
    blocks,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function createService() {
  const prisma = {
    artist: {
      findUnique: jest.fn(),
    },
    page: {
      findUnique: jest.fn(),
    },
    analyticsEvent: {
      create: jest.fn().mockResolvedValue(undefined),
    },
    block: {
      findUnique: jest.fn(),
    },
    smartLink: {
      findUnique: jest.fn(),
    },
  };

  const tenantResolver = {
    resolveByUsername: jest.fn(),
    resolveByDomain: jest.fn(),
  };

  const posthog = {
    capture: jest.fn(),
  };

  const shopifyService = {
    getPublicStoreSelection: jest.fn(),
  };

  const merchService = {
    getPublicProducts: jest.fn(),
  };

  const service = new PublicPagesService(
    prisma as never,
    tenantResolver as never,
    posthog as never,
    shopifyService as never,
    merchService as never,
  );

  return { service, prisma, tenantResolver, posthog };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PublicPagesService', () => {
  describe('getPageByUsername', () => {
    it('resolves a published page for a known artist', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-1',
        username: 'test-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow());

      const result = await service.getPageByUsername('test-artist');

      expect(result.artist.username).toBe('test-artist');
      expect(result.artist.displayName).toBe('Test Artist');
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0]?.type).toBe('links');
    });

    it('throws NotFoundException for an unknown username', async () => {
      const { service, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue(null);

      await expect(service.getPageByUsername('nobody')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when artist has no page', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-no-page',
        username: 'no-page-artist',
      });

      prisma.page.findUnique.mockResolvedValue(null);

      await expect(service.getPageByUsername('no-page-artist')).rejects.toThrow(NotFoundException);
    });

    it('returns promoSlot=free_branding for a free-plan artist', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-free',
        username: 'free-artist',
      });

      prisma.page.findUnique.mockResolvedValue(
        makePageRow({ subscription: null }), // null → free tier
      );

      const result = await service.getPageByUsername('free-artist');

      expect(result.promoSlot.kind).toBe('free_branding');
    });

    it('returns promoSlot=none when artist has remove_stagelink_branding (pro_plus)', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-proplus',
        username: 'proplus-artist',
      });

      prisma.page.findUnique.mockResolvedValue(
        makePageRow({
          subscription: {
            plan: 'pro_plus',
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        }),
      );

      const result = await service.getPageByUsername('proplus-artist');

      expect(result.promoSlot.kind).toBe('none');
    });

    it('sets publicEpkAvailable=true when EPK is published', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-epk',
        username: 'epk-artist',
      });

      prisma.page.findUnique.mockResolvedValue(
        makePageRow({
          subscription: {
            plan: 'pro_plus',
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          epk: { isPublished: true },
        }),
      );

      const result = await service.getPageByUsername('epk-artist');

      expect(result.publicEpkAvailable).toBe(true);
    });

    it('sets publicEpkAvailable=false when EPK is not published', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-no-epk',
        username: 'no-epk-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow({ epk: { isPublished: false } }));

      const result = await service.getPageByUsername('no-epk-artist');

      expect(result.publicEpkAvailable).toBe(false);
    });

    it('fires analytics page_view when ctx is provided', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-analytics',
        username: 'analytics-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow());

      await service.getPageByUsername('analytics-artist', {
        ip: '1.2.3.4',
        locale: 'en',
        userAgent: 'Mozilla/5.0',
      });

      // Give the fire-and-forget a tick to execute
      await new Promise((r) => setImmediate(r));

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            artistId: 'artist-analytics',
            eventType: 'page_view',
          }),
        }),
      );
    });

    it('does NOT fire analytics when ctx is omitted', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-no-analytics',
        username: 'no-analytics-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow());
      prisma.analyticsEvent.create.mockClear();

      await service.getPageByUsername('no-analytics-artist');

      // ctx omitted → no page_view event
      await new Promise((r) => setImmediate(r));
      expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
    });

    it('resolves the locale from ctx and falls back to en', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-locale',
        username: 'locale-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow());

      // With a specific locale
      const resultEs = await service.getPageByUsername('locale-artist', { locale: 'es' });
      expect(resultEs.locale).toBe('es');

      // Without locale → default en
      const resultDefault = await service.getPageByUsername('locale-artist');
      expect(resultDefault.locale).toBe('en');
    });

    it('returns an empty blocks array when no published blocks exist', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-empty',
        username: 'empty-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow({}, []));

      const result = await service.getPageByUsername('empty-artist');

      expect(result.blocks).toEqual([]);
    });

    it('does not throw when analytics DB write fails (fire-and-forget)', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByUsername.mockResolvedValue({
        artistId: 'artist-fire-forget',
        username: 'ff-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow());
      prisma.analyticsEvent.create.mockRejectedValue(new Error('DB timeout'));

      // Should not throw even though analytics write fails
      await expect(
        service.getPageByUsername('ff-artist', { ip: '1.2.3.4' }),
      ).resolves.toBeDefined();
    });
  });

  describe('getPageByDomain', () => {
    it('throws NotFoundException for an unrecognized domain', async () => {
      const { service, tenantResolver } = createService();

      tenantResolver.resolveByDomain.mockResolvedValue(null);

      await expect(service.getPageByDomain('unknown.example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves a page via custom domain', async () => {
      const { service, prisma, tenantResolver } = createService();

      tenantResolver.resolveByDomain.mockResolvedValue({
        artistId: 'artist-domain',
        username: 'domain-artist',
      });

      prisma.page.findUnique.mockResolvedValue(makePageRow());

      const result = await service.getPageByDomain('myband.com');

      expect(result.artist.username).toBe('test-artist');
    });
  });

  describe('recordLinkClick', () => {
    it('records link clicks when scoped block and smart link belong to the artist', async () => {
      const { service, prisma } = createService();

      prisma.block.findUnique.mockResolvedValue({
        isPublished: true,
        page: { artistId: 'artist-1' },
      });
      prisma.smartLink.findUnique.mockResolvedValue({
        artistId: 'artist-1',
        isActive: true,
      });

      await service.recordLinkClick('artist-1', {
        blockId: 'block-1',
        smartLinkId: 'smart-link-1',
        linkItemId: 'item-1',
        isSmartLink: true,
      });

      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            artistId: 'artist-1',
            blockId: 'block-1',
            smartLinkId: 'smart-link-1',
          }),
        }),
      );
    });

    it('drops link clicks when block belongs to another artist', async () => {
      const { service, prisma } = createService();

      prisma.block.findUnique.mockResolvedValue({
        isPublished: true,
        page: { artistId: 'artist-other' },
      });

      await service.recordLinkClick('artist-1', {
        blockId: 'block-other',
        linkItemId: 'item-1',
      });

      expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
    });

    it('drops link clicks when smart link belongs to another artist', async () => {
      const { service, prisma } = createService();

      prisma.smartLink.findUnique.mockResolvedValue({
        artistId: 'artist-other',
        isActive: true,
      });

      await service.recordLinkClick('artist-1', {
        smartLinkId: 'smart-link-other',
        linkItemId: 'item-1',
        isSmartLink: true,
      });

      expect(prisma.analyticsEvent.create).not.toHaveBeenCalled();
    });
  });
});
