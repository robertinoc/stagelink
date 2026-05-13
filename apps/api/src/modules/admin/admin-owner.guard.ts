import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { AdminRoleService } from './admin-role.service';

/**
 * AdminAccessGuard — allows Behind owners and read-only admins.
 *
 * Must run AFTER JwtAuthGuard (which is the global APP_GUARD), so
 * request.user is already validated and set when this guard runs.
 */
@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly adminRoles: AdminRoleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!(await this.adminRoles.hasAccess(user.email))) {
      throw new ForbiddenException('Access restricted to Behind admins');
    }

    return true;
  }
}

/**
 * AdminOwnerGuard — restricts access to Behind platform owners only.
 *
 * Returns:
 *   401 — if request.user is missing (should not happen; defensive)
 *   403 — if user.email is not an env or Redis owner
 */
@Injectable()
export class AdminOwnerGuard implements CanActivate {
  constructor(private readonly adminRoles: AdminRoleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!(await this.adminRoles.isOwner(user.email))) {
      throw new ForbiddenException('Access restricted to platform owners');
    }

    return true;
  }
}
