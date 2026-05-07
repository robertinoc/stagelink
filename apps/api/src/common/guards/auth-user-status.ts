import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';

export function requireActiveAuthUser(user: User): User {
  if (user.deletedAt) {
    throw new UnauthorizedException('User account is deleted');
  }

  if (user.isSuspended) {
    throw new ForbiddenException('User account is suspended');
  }

  return user;
}
