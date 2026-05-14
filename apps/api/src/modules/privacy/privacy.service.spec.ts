import { ForbiddenException } from '@nestjs/common';
import { PrivacyService } from './privacy.service';

describe('PrivacyService', () => {
  const user = {
    id: 'user_123',
    workosId: 'user_workos_123',
    email: 'artist@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    avatarUrl: null,
    isSuspended: false,
    deletedAt: null,
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    updatedAt: new Date('2026-05-01T10:00:00.000Z'),
  };

  function createService() {
    let prisma: {
      $transaction: jest.Mock;
      dsarRequest: { create: jest.Mock; update: jest.Mock };
      user: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock; update: jest.Mock };
      artistMembership: { findMany: jest.Mock; delete: jest.Mock };
      artist: { findMany: jest.Mock; delete: jest.Mock };
      subscriber: { deleteMany: jest.Mock };
      auditLog: { findMany: jest.Mock };
    };

    prisma = {
      $transaction: jest.fn(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
      ),
      dsarRequest: {
        create: jest.fn().mockResolvedValue({
          id: 'dsar_123',
          userId: user.id,
          requestType: 'access',
          status: 'verified',
          metadata: {},
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue({ ...user, firstName: 'Grace' }),
      },
      artistMembership: {
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({}),
      },
      artist: {
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({}),
      },
      subscriber: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const auditService = {
      log: jest.fn(),
    };

    const service = new PrivacyService(prisma as never, auditService as never);
    return { service, prisma, auditService };
  }

  it('exports user data without leaking storage keys or provider tokens', async () => {
    const { service, prisma, auditService } = createService();
    const artist = {
      id: 'artist_123',
      username: 'ada',
      shopifyConnection: {
        id: 'shopify_123',
        storefrontToken: 'shpat_sensitive',
        storeDomain: 'ada.myshopify.com',
      },
      merchProviderConnection: {
        id: 'merch_123',
        apiToken: 'printful_sensitive',
        storeId: 'store_123',
      },
      insightsConnections: [
        {
          id: 'insights_123',
          platform: 'spotify',
          accessToken: 'spotify_access_sensitive',
          refreshToken: 'spotify_refresh_sensitive',
        },
      ],
      assets: [
        {
          id: 'asset_123',
          kind: 'avatar',
          objectKey: 'artists/artist_123/avatar/private.png',
          bucket: 'stagelink-assets',
          mimeType: 'image/png',
          sizeBytes: 1024,
          deliveryUrl: 'https://cdn.stagelink.test/avatar.png',
          status: 'uploaded',
          originalFilename: 'avatar.png',
          createdAt: new Date('2026-05-01T10:00:00.000Z'),
          updatedAt: new Date('2026-05-01T10:00:00.000Z'),
        },
      ],
    };
    prisma.artist.findMany.mockResolvedValueOnce([artist]);

    const result = (await service.exportUserData(user as never, '127.0.0.1')) as any;

    expect(result.artists[0].shopifyConnection.storefrontToken).toBe('[redacted]');
    expect(result.artists[0].merchProviderConnection.apiToken).toBe('[redacted]');
    expect(result.artists[0].insightsConnections[0].accessToken).toBe('[redacted]');
    expect(result.artists[0].insightsConnections[0].refreshToken).toBe('[redacted]');
    expect(result.artists[0].assets[0]).not.toHaveProperty('objectKey');
    expect(result.artists[0].assets[0]).not.toHaveProperty('bucket');
    expect(prisma.dsarRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dsar_123' },
        data: expect.objectContaining({ status: 'completed' }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: user.id,
        action: 'privacy.dsar.export',
        ipAddress: '127.0.0.1',
      }),
    );
  });

  it('rejects account deletion when the confirmation email does not match', async () => {
    const { service, prisma } = createService();

    await expect(
      service.deleteAccount(user as never, { confirmEmail: 'other@example.com' }, '127.0.0.1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.dsarRequest.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('anonymizes the user, deletes sole-owner workspaces, and removes shared memberships', async () => {
    const { service, prisma, auditService } = createService();
    prisma.artistMembership.findMany.mockResolvedValueOnce([
      {
        artistId: 'artist_owned',
        userId: user.id,
        role: 'owner',
        artist: {
          id: 'artist_owned',
          username: 'owned',
          memberships: [{ userId: user.id, role: 'owner' }],
        },
      },
      {
        artistId: 'artist_shared',
        userId: user.id,
        role: 'editor',
        artist: {
          id: 'artist_shared',
          username: 'shared',
          memberships: [
            { userId: user.id, role: 'editor' },
            { userId: 'user_owner', role: 'owner' },
          ],
        },
      },
    ]);

    const result = await service.deleteAccount(
      user as never,
      { confirmEmail: 'ARTIST@example.com' },
      '127.0.0.1',
    );

    expect(prisma.subscriber.deleteMany).toHaveBeenCalledWith({
      where: { artistId: 'artist_owned' },
    });
    expect(prisma.artist.delete).toHaveBeenCalledWith({ where: { id: 'artist_owned' } });
    expect(prisma.artistMembership.delete).toHaveBeenCalledWith({
      where: { artistId_userId: { artistId: 'artist_shared', userId: user.id } },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: expect.objectContaining({
        email: `deleted-${user.id}@deleted.stagelink.local`,
        workosId: `deleted:${user.id}:${user.workosId}`,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        isSuspended: true,
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({
        requestId: 'dsar_123',
        status: 'completed',
        deletedUsername: 'owned',
        deletedArtistCount: 1,
        removedMembershipCount: 1,
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: null,
        action: 'privacy.dsar.erasure.completed',
        entityId: user.id,
      }),
    );
  });
});
