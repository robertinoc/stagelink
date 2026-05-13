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
  artists: [{ username: 'ada' }],
};

function createService() {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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
});
