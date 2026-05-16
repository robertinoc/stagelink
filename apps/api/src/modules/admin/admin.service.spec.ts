import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';

const baseUser = {
  id: 'user_1',
  email: 'artist@example.com',
  firstName: 'Ada',
  lastName: 'Artist',
  isSuspended: false,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  artists: [{ username: 'ada', subscription: null }],
};

function createService() {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const auditService = {
    log: jest.fn(),
  };

  return {
    prisma,
    auditService,
    service: new AdminService(prisma as never, auditService as never),
  };
}

describe('AdminService', () => {
  it('lists users without exposing WorkOS IDs', async () => {
    const { service, prisma } = createService();
    prisma.user.findMany.mockResolvedValueOnce([baseUser]);

    await expect(service.listUsers()).resolves.toEqual([
      {
        id: 'user_1',
        email: 'artist@example.com',
        name: 'Ada Artist',
        firstName: 'Ada',
        lastName: 'Artist',
        artistUsernames: ['ada'],
        isSuspended: false,
        createdAt: baseUser.createdAt,
        subscription: null,
      },
    ]);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ workosId: true }),
      }),
    );
  });

  it('writes an audit log when suspending a user', async () => {
    const { service, prisma, auditService } = createService();
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_1',
      email: 'artist@example.com',
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValueOnce({ ...baseUser, isSuspended: true });

    await service.updateUserStatus('user_1', true, 'owner_1', '198.51.100.10');

    expect(auditService.log).toHaveBeenCalledWith({
      actorId: 'owner_1',
      action: 'admin.user.suspend',
      entityType: 'user',
      entityId: 'user_1',
      metadata: { targetEmail: 'artist@example.com' },
      ipAddress: '198.51.100.10',
    });
  });

  it('does not suspend bootstrap owner accounts', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'owner',
      email: 'robertinoc@gmail.com',
      deletedAt: null,
    });

    await expect(service.updateUserStatus('owner', true, 'owner_1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('writes an audit log when soft-deleting a user', async () => {
    const { service, prisma, auditService } = createService();
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_1',
      email: 'artist@example.com',
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValueOnce({ ...baseUser, deletedAt: new Date() });

    await service.softDeleteUser('user_1', 'owner_1', '198.51.100.10');

    expect(auditService.log).toHaveBeenCalledWith({
      actorId: 'owner_1',
      action: 'admin.user.soft_delete',
      entityType: 'user',
      entityId: 'user_1',
      metadata: { targetEmail: 'artist@example.com' },
      ipAddress: '198.51.100.10',
    });
  });

  it('rejects admin mutations for missing or deleted users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.softDeleteUser('missing', 'owner_1')).rejects.toThrow(NotFoundException);
  });

  it('rejects invitations for existing users', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'user_1' });

    await expect(service.sendInvitation('artist@example.com', 'owner_1')).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Manual access (grant / extend / revoke) ──────────────────────────────

  const subRow = {
    plan: 'free',
    status: 'inactive',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    manualAccessPlan: 'pro_plus',
    manualAccessStartsAt: new Date('2026-01-01T00:00:00.000Z'),
    manualAccessExpiresAt: new Date('2099-01-01T00:00:00.000Z'),
    manualAccessReason: 'partner trial',
    manualAccessGrantedBy: 'owner_1',
  };

  function mockArtist(prisma: ReturnType<typeof createService>['prisma']) {
    prisma.user.findUnique.mockResolvedValueOnce({
      email: 'artist@example.com',
      deletedAt: null,
      artists: [{ id: 'artist_1', subscription: null }],
    });
  }

  it('grants temporary access without touching commercial billing', async () => {
    const { service, prisma, auditService } = createService();
    mockArtist(prisma);
    prisma.subscription.upsert.mockResolvedValueOnce(subRow);

    const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const result = await service.grantAccess(
      'user_1',
      'pro_plus' as never,
      future,
      'partner trial',
      'owner_1',
      '198.51.100.10',
    );

    expect(result.manualAccessPlan).toBe('pro_plus');
    expect(result.isManualGrantActive).toBe(true);
    expect(result.effectiveAccess).toBe('pro_plus');
    // No plan/status in the upsert update payload
    const upsertArg = prisma.subscription.upsert.mock.calls[0][0];
    expect(upsertArg.update).not.toHaveProperty('plan');
    expect(upsertArg.update).not.toHaveProperty('status');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.access.grant', actorId: 'owner_1' }),
    );
  });

  it('rejects a grant with a past expiry', async () => {
    const { service, prisma } = createService();
    mockArtist(prisma);

    await expect(
      service.grantAccess(
        'user_1',
        'pro' as never,
        new Date(Date.now() - 86_400_000).toISOString(),
        undefined,
        'owner_1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a grant expiring more than a year out', async () => {
    const { service, prisma } = createService();
    mockArtist(prisma);

    await expect(
      service.grantAccess(
        'user_1',
        'pro' as never,
        new Date(Date.now() + 400 * 86_400_000).toISOString(),
        undefined,
        'owner_1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('extends an existing grant', async () => {
    const { service, prisma, auditService } = createService();
    mockArtist(prisma);
    prisma.subscription.findUnique.mockResolvedValueOnce({ manualAccessPlan: 'pro' });
    prisma.subscription.update.mockResolvedValueOnce(subRow);

    await service.extendAccess(
      'user_1',
      new Date(Date.now() + 60 * 86_400_000).toISOString(),
      undefined,
      'owner_1',
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.access.extend' }),
    );
  });

  it('rejects extending when no grant exists', async () => {
    const { service, prisma } = createService();
    mockArtist(prisma);
    prisma.subscription.findUnique.mockResolvedValueOnce({ manualAccessPlan: null });

    await expect(
      service.extendAccess(
        'user_1',
        new Date(Date.now() + 86_400_000).toISOString(),
        undefined,
        'owner_1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('revokes a grant and nulls all manual fields', async () => {
    const { service, prisma, auditService } = createService();
    mockArtist(prisma);
    prisma.subscription.findUnique.mockResolvedValueOnce({ manualAccessPlan: 'pro_plus' });
    prisma.subscription.update.mockResolvedValueOnce({
      ...subRow,
      manualAccessPlan: null,
      manualAccessStartsAt: null,
      manualAccessExpiresAt: null,
      manualAccessReason: null,
      manualAccessGrantedBy: null,
    });

    const result = await service.revokeAccess('user_1', 'owner_1');

    expect(result.manualAccessPlan).toBeNull();
    expect(result.isManualGrantActive).toBe(false);
    const updateArg = prisma.subscription.update.mock.calls[0][0];
    expect(updateArg.data).toEqual({
      manualAccessPlan: null,
      manualAccessStartsAt: null,
      manualAccessExpiresAt: null,
      manualAccessReason: null,
      manualAccessGrantedBy: null,
    });
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.access.revoke' }),
    );
  });
});
