import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * JwtAuthGuard — stub placeholder.
 *
 * Real implementation (T2): validate WorkOS JWT from Authorization header,
 * attach decoded user to request.user, throw UnauthorizedException on failure.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('protected-route')
 *   ...
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO (T2-auth): Validate WorkOS JWT and populate request.user
    // For now, allow all requests through so stubs remain testable.
    return true;
  }
}

/**
 * OwnershipGuard — stub placeholder.
 *
 * Real implementation (T2): verify that request.user.artistId matches
 * the resource being accessed (artist, page, blocks).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @Get(':pageId')
 *   ...
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO (T2-auth): Check resource ownership against request.user
    return true;
  }
}
