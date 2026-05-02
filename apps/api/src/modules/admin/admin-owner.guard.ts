import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';

/**
 * Owner emails allowed to access Behind the Stage admin endpoints.
 * Keep in sync with apps/web/src/lib/behind-config.ts.
 */
const BEHIND_OWNER_EMAILS: readonly string[] = ['robertinoc@gmail.com'];

/**
 * AdminOwnerGuard — restricts access to platform owner emails only.
 *
 * Must run AFTER JwtAuthGuard (which is the global APP_GUARD), so
 * request.user is already validated and set when this guard runs.
 *
 * Returns:
 *   401 — if request.user is missing (should not happen; defensive)
 *   403 — if user.email is not in BEHIND_OWNER_EMAILS
 */
@Injectable()
export class AdminOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!BEHIND_OWNER_EMAILS.includes(user.email.toLowerCase())) {
      throw new ForbiddenException('Access restricted to platform owners');
    }

    return true;
  }
}
