import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'jwks'),
  jwtVerify: jest.fn(),
}));

import { jwtVerify } from 'jose';
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

function makeGuard(options: { issuer?: string } = {}) {
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
  const prisma = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockVerifiedPayload(payload: Record<string, unknown>) {
    jwtVerifyMock.mockResolvedValueOnce({
      payload,
      protectedHeader: { alg: 'RS256' },
      key: new Uint8Array(),
    } as Awaited<ReturnType<typeof jwtVerify>>);
  }

  it('validates WorkOS access tokens with the default issuer allowlist', async () => {
    mockVerifiedPayload({ sub: 'user_workos_1', sid: 'session_1' });

    const guard = makeGuard();
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);

    expect(jwtVerifyMock).toHaveBeenCalledWith('valid-token', 'jwks', {
      issuer: ['https://api.workos.com', 'https://api.workos.com/'],
    });
  });

  it('allows a custom WorkOS issuer when a custom auth domain is configured', async () => {
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
});
