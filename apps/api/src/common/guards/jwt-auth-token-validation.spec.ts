import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'jwks'),
  jwtVerify: jest.fn(),
}));

jest.mock('../../lib/workos', () => ({
  getWorkOS: jest.fn(),
}));

import { jwtVerify } from 'jose';
import { getWorkOS } from '../../lib/workos';
import { JwtAuthGuard } from './index';

const user = {
  id: 'user_1',
  workosId: 'user_workos_1',
  email: 'artist@example.com',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  isSuspended: false,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeGuard(
  options: {
    issuer?: string;
    prisma?: {
      user: {
        findUnique: jest.Mock;
        update?: jest.Mock;
        upsert?: jest.Mock;
      };
    };
  } = {},
) {
  const reflector = {
    getAllAndOverride: jest.fn(() => false),
  } as unknown as Reflector;
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'workos.clientId') return 'client_test';
      throw new Error(`Unexpected config key: ${key}`);
    }),
    get: jest.fn((key: string) => {
      if (key === 'workos.jwtIssuer') return options.issuer;
      return undefined;
    }),
  } as unknown as ConfigService;
  const prisma = options.prisma ?? {
    user: {
      findUnique: jest.fn(() => Promise.resolve(user)),
    },
  };

  return new JwtAuthGuard(reflector, configService, prisma as never);
}

function makeContext(token = 'valid-token') {
  const request = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard token validation', () => {
  const jwtVerifyMock = jest.mocked(jwtVerify);
  const getWorkOSMock = jest.mocked(getWorkOS);

  beforeEach(() => {
    jest.clearAllMocks();
    getWorkOSMock.mockReturnValue({
      userManagement: {
        getUser: jest.fn().mockResolvedValue({
          email: 'artist@example.com',
          firstName: 'Ada',
          lastName: 'Lovelace',
          profilePictureUrl: null,
        }),
      },
    } as never);
  });

  function mockVerifiedPayload(payload: Record<string, unknown>) {
    jwtVerifyMock.mockResolvedValueOnce({
      payload,
      protectedHeader: { alg: 'RS256' },
      key: new Uint8Array(),
    } as Awaited<ReturnType<typeof jwtVerify>>);
  }

  it('skips issuer check when WORKOS_JWT_ISSUER is not configured', async () => {
    // Without WORKOS_JWT_ISSUER, jwtVerify is called without an issuer option.
    // The JWKS signature + sub/sid claim checks are the primary security controls.
    mockVerifiedPayload({ sub: 'user_workos_1', sid: 'session_1' });

    const guard = makeGuard();
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);

    expect(jwtVerifyMock).toHaveBeenCalledWith('valid-token', 'jwks', undefined);
  });

  it('enforces issuer claim when WORKOS_JWT_ISSUER is explicitly configured', async () => {
    // When WORKOS_JWT_ISSUER is set, jwtVerify receives the issuer allowlist
    // (both with and without trailing slash for jose compatibility).
    mockVerifiedPayload({ sub: 'user_workos_1', sid: 'session_1' });

    const guard = makeGuard({ issuer: 'https://auth.stagelink.art/' });
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);

    expect(jwtVerifyMock).toHaveBeenCalledWith('valid-token', 'jwks', {
      issuer: ['https://auth.stagelink.art', 'https://auth.stagelink.art/'],
    });
  });

  it('rejects signed tokens that do not identify a WorkOS user session', async () => {
    mockVerifiedPayload({ sub: 'client_123', sid: 'session_1' });

    const guard = makeGuard();
    await expect(guard.canActivate(makeContext())).rejects.toThrow(UnauthorizedException);
  });

  it('rejects signed user tokens that are missing a WorkOS session id', async () => {
    mockVerifiedPayload({ sub: 'user_workos_1' });

    const guard = makeGuard();
    await expect(guard.canActivate(makeContext())).rejects.toThrow(UnauthorizedException);
  });

  it('accepts WorkOS session ids that do not use the default session_ prefix', async () => {
    // WorkOS custom auth domains may issue session IDs with different prefixes.
    // We validate that sid exists and is non-empty, not the exact prefix.
    mockVerifiedPayload({ sub: 'user_workos_1', sid: 'sess_abc123' });

    const guard = makeGuard();
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
  });

  it('releases a deleted account tombstone and provisions a clean user for onboarding', async () => {
    mockVerifiedPayload({ sub: 'user_workos_1', sid: 'session_1' });
    const deletedUser = {
      ...user,
      id: 'deleted_user_1',
      deletedAt: new Date('2026-05-14T20:00:00.000Z'),
      isSuspended: true,
      email: 'deleted-deleted_user_1@deleted.stagelink.local',
    };
    const cleanUser = {
      ...user,
      id: 'clean_user_1',
      email: 'artist@example.com',
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(deletedUser)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        update: jest.fn().mockResolvedValue({
          ...deletedUser,
          workosId: `deleted:${deletedUser.id}:${deletedUser.workosId}`,
        }),
        upsert: jest.fn().mockResolvedValue(cleanUser),
      },
    };

    const guard = makeGuard({ prisma });
    const context = makeContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: deletedUser.id },
      data: { workosId: `deleted:${deletedUser.id}:${deletedUser.workosId}` },
    });
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workosId: deletedUser.workosId },
        create: expect.objectContaining({
          workosId: deletedUser.workosId,
          email: 'artist@example.com',
        }),
      }),
    );
    expect((context.switchToHttp().getRequest() as { user?: { id: string } }).user?.id).toBe(
      cleanUser.id,
    );
  });
});
