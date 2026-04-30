import { Test, type TestingModule } from '@nestjs/testing';
import { ArtistCategory, type User } from '@prisma/client';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { PostHogService } from '../analytics/posthog.service';
import { OnboardingController } from '../onboarding/onboarding.controller';
import { OnboardingService } from '../onboarding/onboarding.service';
import { PublicPagesController } from './public-pages.controller';
import { PublicPagesService } from './public-pages.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import { PrismaService } from '../../lib/prisma.service';
import { resetIntegrationDatabase } from '../../test/integration-db';
import { ShopifyService } from '../shopify/shopify.service';
import { MerchService } from '../merch/merch.service';

describe('public page integration flow', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let onboardingController: OnboardingController;
  let publicPagesController: PublicPagesController;
  let posthog: { capture: jest.Mock };

  const requestWithIp = (ip = '203.0.113.24') =>
    ({
      headers: {
        'x-forwarded-for': ip,
      },
      ip,
    }) as unknown as Request;

  const eventually = async (assertion: () => Promise<void> | void, timeoutMs = 2_000) => {
    const startedAt = Date.now();
    let lastError: unknown;

    while (Date.now() - startedAt < timeoutMs) {
      try {
        await assertion();
        return;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }

    throw lastError;
  };

  beforeAll(async () => {
    posthog = { capture: jest.fn() };

    moduleRef = await Test.createTestingModule({
      controllers: [OnboardingController, PublicPagesController],
      providers: [
        PrismaService,
        AuditService,
        OnboardingService,
        TenantResolverService,
        PublicPagesService,
        {
          provide: PostHogService,
          useValue: posthog,
        },
        {
          provide: ShopifyService,
          useValue: {
            getPublicStoreSelection: jest.fn(),
          } satisfies Partial<ShopifyService>,
        },
        {
          provide: MerchService,
          useValue: {
            getPublicProducts: jest.fn(),
          } satisfies Partial<MerchService>,
        },
      ],
    })
      .overrideProvider(PostHogService)
      .useValue(posthog)
      .compile();

    prisma = moduleRef.get(PrismaService);
    onboardingController = moduleRef.get(OnboardingController);
    publicPagesController = moduleRef.get(PublicPagesController);
    await prisma.$connect();
  });

  beforeEach(async () => {
    posthog.capture.mockClear();
    await resetIntegrationDatabase(prisma);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates onboarding records, resolves the tenant, returns public page data and records analytics', async () => {
    const user = await prisma.user.create({
      data: {
        workosId: 'workos_integration_user',
        email: 'integration-flow@stagelink.test',
        firstName: 'Integration',
        lastName: 'Artist',
      },
    });

    await expect(
      onboardingController.checkUsername({ value: ' Integration-Flow ' }),
    ).resolves.toEqual({
      available: true,
      normalizedUsername: 'integration-flow',
    });

    const onboardingResult = await onboardingController.completeOnboarding(
      {
        displayName: ' Integration Artist ',
        username: ' Integration-Flow ',
        category: ArtistCategory.musician,
        secondaryCategories: [ArtistCategory.dj, ArtistCategory.musician, ArtistCategory.dj],
      },
      user as User,
      requestWithIp(),
    );

    expect(onboardingResult).toEqual({
      artistId: expect.any(String),
      username: 'integration-flow',
      displayName: 'Integration Artist',
      pageId: expect.any(String),
    });

    await expect(
      prisma.artistMembership.findUnique({
        where: {
          artistId_userId: {
            artistId: onboardingResult.artistId,
            userId: user.id,
          },
        },
      }),
    ).resolves.toMatchObject({
      artistId: onboardingResult.artistId,
      userId: user.id,
      role: 'owner',
    });

    await eventually(async () => {
      await expect(
        prisma.auditLog.findFirst({
          where: {
            entityId: onboardingResult.artistId,
            action: 'artist.onboarding.complete',
          },
        }),
      ).resolves.toMatchObject({
        actorId: user.id,
        entityType: 'artist',
        ipAddress: '203.0.113.24',
      });
    });

    await prisma.artist.update({
      where: { id: onboardingResult.artistId },
      data: {
        bio: 'Base bio',
        translations: {
          displayName: { es: 'Artista Integrado' },
          bio: { es: 'Bio localizada' },
        },
      },
    });

    const publishedBlock = await prisma.block.create({
      data: {
        pageId: onboardingResult.pageId,
        type: 'links',
        title: 'Links',
        position: 2,
        isPublished: true,
        config: {
          items: [
            {
              id: 'spotify',
              label: 'Spotify',
              url: 'https://open.spotify.com/artist/example',
            },
          ],
        },
        localizedContent: {
          title: { es: 'Enlaces' },
          links: {
            itemLabels: {
              spotify: { es: 'Spotify ES' },
            },
          },
        },
      },
    });

    await prisma.block.create({
      data: {
        pageId: onboardingResult.pageId,
        type: 'text',
        title: 'Draft',
        position: 1,
        isPublished: false,
        config: { body: 'Hidden draft content' },
      },
    });

    const response = await publicPagesController.getByUsername(
      ' Integration-Flow ',
      requestWithIp('198.51.100.9'),
      'es',
      undefined,
      'https://referrer.example/source',
      '"macOS"',
      'Mozilla/5.0',
      undefined,
      'true',
      undefined,
    );

    expect(response).toMatchObject({
      artistId: onboardingResult.artistId,
      pageId: onboardingResult.pageId,
      locale: 'es',
      artist: {
        username: 'integration-flow',
        displayName: 'Artista Integrado',
        bio: 'Bio localizada',
      },
      blocks: [
        {
          id: publishedBlock.id,
          type: 'links',
          title: 'Enlaces',
          config: {
            items: [
              expect.objectContaining({
                id: 'spotify',
                label: 'Spotify ES',
              }),
            ],
          },
        },
      ],
    });

    await eventually(async () => {
      await expect(
        prisma.analyticsEvent.findMany({
          where: { artistId: onboardingResult.artistId },
          orderBy: { createdAt: 'asc' },
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          eventType: 'page_view',
          isQa: true,
          isInternal: false,
          isBotSuspected: false,
          hasTrackingConsent: true,
          environment: 'development',
        }),
      ]);
    });

    expect(posthog.capture).not.toHaveBeenCalled();

    await publicPagesController.reportLinkClick(
      {
        artistId: onboardingResult.artistId,
        blockId: publishedBlock.id,
        linkItemId: 'spotify',
        label: 'Spotify ES',
      },
      requestWithIp('198.51.100.9'),
      'Mozilla/5.0',
      undefined,
      'true',
      undefined,
    );

    await expect(
      prisma.analyticsEvent.findFirst({
        where: {
          artistId: onboardingResult.artistId,
          eventType: 'link_click',
          linkItemId: 'spotify',
        },
      }),
    ).resolves.toMatchObject({
      blockId: publishedBlock.id,
      label: 'Spotify ES',
      hasTrackingConsent: true,
      isQa: false,
    });
  });

  it('resolves active custom domains through the same public page pipeline', async () => {
    const user = await prisma.user.create({
      data: {
        workosId: 'workos_domain_user',
        email: 'domain-flow@stagelink.test',
      },
    });

    const onboardingResult = await onboardingController.completeOnboarding(
      {
        displayName: 'Domain Artist',
        username: 'domain-flow',
        category: ArtistCategory.creator,
      },
      user as User,
      requestWithIp(),
    );

    await prisma.customDomain.create({
      data: {
        artistId: onboardingResult.artistId,
        domain: 'domain-artist.test',
        status: 'active',
        isPrimary: true,
      },
    });

    await prisma.block.create({
      data: {
        pageId: onboardingResult.pageId,
        type: 'text',
        title: 'About',
        position: 0,
        isPublished: true,
        config: { body: 'Domain page body' },
      },
    });

    const response = await publicPagesController.getByDomain(
      requestWithIp('198.51.100.20'),
      'WWW.DOMAIN-ARTIST.TEST:443',
      'en',
      undefined,
      undefined,
      undefined,
      'Mozilla/5.0',
      undefined,
      undefined,
      undefined,
    );

    expect(response).toMatchObject({
      artistId: onboardingResult.artistId,
      artist: {
        username: 'domain-flow',
        displayName: 'Domain Artist',
      },
      blocks: [
        expect.objectContaining({
          type: 'text',
          title: 'About',
        }),
      ],
    });
  });
});
