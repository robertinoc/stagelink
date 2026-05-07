import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { requireActiveAuthUser } from './auth-user-status';

function makeUser(overrides: Partial<User> = {}): User {
  return {
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
    ...overrides,
  };
}

describe('requireActiveAuthUser', () => {
  it('returns active users', () => {
    const user = makeUser();

    expect(requireActiveAuthUser(user)).toBe(user);
  });

  it('rejects soft-deleted users', () => {
    const user = makeUser({ deletedAt: new Date('2026-01-02T00:00:00.000Z') });

    expect(() => requireActiveAuthUser(user)).toThrow(UnauthorizedException);
  });

  it('rejects suspended users', () => {
    const user = makeUser({ isSuspended: true });

    expect(() => requireActiveAuthUser(user)).toThrow(ForbiddenException);
  });
});
