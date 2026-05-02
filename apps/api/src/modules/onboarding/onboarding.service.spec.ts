import { BadRequestException, ConflictException } from '@nestjs/common';
import { ArtistCategory, type User } from '@prisma/client';
import { OnboardingService } from './onboarding.service';
import type { AuditService } from '../audit/audit.service';
import type { PostHogService } from '../analytics/posthog.service';
import type { PrismaService } from '../../lib/prisma.service';

describe('OnboardingService', () => {
  const user = {
    id: 'user_1',
    workosId: 'workos_1',
    email: 'artist@example.com',
    firstName: 'Artist',
    lastName: 'User',
    avatarUrl: null,
    isSuspended: false,
    deletedAt: null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  } satisfies User;

  const createService = () => {
    const prisma = {
      artist: {
        findUnique: jest.fn(),
      },
      artistMembership: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const auditService = {
      log: jest.fn(),
    };
    const posthog = {
      capture: jest.fn(),
    };

    return {
      service: new OnboardingService(
        prisma as unknown as PrismaService,
        auditService as unknown as AuditService,
        posthog as unknown as PostHogService,
      ),
      prisma,
      auditService,
      posthog,
    };
  };

  describe('checkUsername', () => {
    it('normalizes input and returns available when no artist exists', async () => {
      const { service, prisma } = createService();
      prisma.artist.findUnique.mockResolvedValue(null);

      await expect(service.checkUsername('  Stage-Link  ')).resolves.toEqual({
        available: true,
        normalizedUsername: 'stage-link',
      });
      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { username: 'stage-link' },
        select: { id: true },
      });
    });

    it('maps format failures to stable reason codes without hitting the database', async () => {
      const { service, prisma } = createService();

      await expect(service.checkUsername('ab')).resolves.toEqual({
        available: false,
        normalizedUsername: 'ab',
        reason: 'too_short',
      });
      await expect(service.checkUsername('artist name')).resolves.toMatchObject({
        available: false,
        reason: 'invalid_chars',
      });
      expect(prisma.artist.findUnique).not.toHaveBeenCalled();
    });

    it('returns reserved and taken usernames distinctly', async () => {
      const { service, prisma } = createService();

      await expect(service.checkUsername('admin')).resolves.toEqual({
        available: false,
        normalizedUsername: 'admin',
        reason: 'reserved',
      });

      prisma.artist.findUnique.mockResolvedValue({ id: 'artist_1' });
      await expect(service.checkUsername('existing')).resolves.toEqual({
        available: false,
        normalizedUsername: 'existing',
        reason: 'taken',
      });
    });
  });

  describe('completeOnboarding', () => {
    it('creates artist, page and owner membership in one transaction', async () => {
      const { service, prisma, auditService, posthog } = createService();
      prisma.artistMembership.count.mockResolvedValue(0);
      prisma.$transaction.mockImplementation(async (callback) =>
        callback({
          artist: {
            create: jest.fn().mockResolvedValue({
              id: 'artist_1',
              username: 'stage-link',
              displayName: 'Stage Link',
            }),
          },
          page: {
            create: jest.fn().mockResolvedValue({ id: 'page_1' }),
          },
          artistMembership: {
            create: jest.fn().mockResolvedValue({ id: 'membership_1' }),
          },
        }),
      );

      await expect(
        service.completeOnboarding(
          {
            displayName: '  Stage Link  ',
            username: ' Stage-Link ',
            category: ArtistCategory.musician,
            secondaryCategories: [ArtistCategory.dj, ArtistCategory.musician, ArtistCategory.dj],
          },
          user,
          '203.0.113.10',
        ),
      ).resolves.toEqual({
        artistId: 'artist_1',
        username: 'stage-link',
        displayName: 'Stage Link',
        pageId: 'page_1',
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'user_1',
          action: 'artist.onboarding.complete',
          entityId: 'artist_1',
          ipAddress: '203.0.113.10',
          metadata: expect.objectContaining({
            username: 'stage-link',
            displayName: 'Stage Link',
            secondaryCategories: [ArtistCategory.dj],
          }),
        }),
      );
      expect(posthog.capture).toHaveBeenCalledWith(
        'onboarding_completed',
        'user_1',
        expect.objectContaining({
          artist_id: 'artist_1',
          username: 'stage-link',
          secondary_categories: [ArtistCategory.dj],
        }),
      );
    });

    it('blocks users that already own an artist', async () => {
      const { service, prisma } = createService();
      prisma.artistMembership.count.mockResolvedValue(1);

      await expect(
        service.completeOnboarding(
          {
            displayName: 'Stage Link',
            username: 'stage-link',
            category: ArtistCategory.musician,
          },
          user,
        ),
      ).rejects.toThrow(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects invalid or reserved usernames before opening a transaction', async () => {
      const { service, prisma } = createService();
      prisma.artistMembership.count.mockResolvedValue(0);

      await expect(
        service.completeOnboarding(
          {
            displayName: 'Stage Link',
            username: 'bad name',
            category: ArtistCategory.musician,
          },
          user,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.completeOnboarding(
          {
            displayName: 'Stage Link',
            username: 'admin',
            category: ArtistCategory.musician,
          },
          user,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('maps Prisma unique constraint failures to a username conflict', async () => {
      const { service, prisma } = createService();
      prisma.artistMembership.count.mockResolvedValue(0);
      prisma.$transaction.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.completeOnboarding(
          {
            displayName: 'Stage Link',
            username: 'stage-link',
            category: ArtistCategory.musician,
          },
          user,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
