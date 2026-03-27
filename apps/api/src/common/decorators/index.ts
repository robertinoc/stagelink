import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';

/**
 * @Public() — marks a route as unauthenticated (opt-out of JwtAuthGuard).
 * Usage: @Public() @Get('artists/:username') — public artist pages.
 *
 * Real implementation (T2): JwtAuthGuard reads IS_PUBLIC_KEY metadata
 * and skips token validation when present.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @CurrentUser() — injects the authenticated user from request.user.
 * Usage: findMe(@CurrentUser() user: AuthUser)
 *
 * Real implementation (T2): populated by JwtAuthGuard after JWT validation.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: unknown }>();
  return request.user;
});

/**
 * @Roles(...roles) — restrict access to specific plan tiers or user roles.
 * Usage: @Roles('pro', 'pro_plus')
 *
 * Real implementation (T2+): RolesGuard reads ROLES_KEY metadata.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @CheckOwnership(resource, param, access?) — configures OwnershipGuard for a route.
 *
 * Tells OwnershipGuard which route param to read and which DB resource to look
 * up to verify that request.user has the required membership level.
 *
 * Usage:
 *   @CheckOwnership('artist', 'artistId')            → read access (default)
 *   @CheckOwnership('page',   'pageId',   'write')   → editor+ access
 *   @CheckOwnership('block',  'blockId',  'owner')   → owner-only access
 *   @CheckOwnership('artist', 'id',       'admin')   → admin+ access
 *
 * Always pair with @UseGuards(OwnershipGuard).
 */
export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipMeta {
  resource: 'artist' | 'page' | 'block';
  param: string;
  access?: 'read' | 'write' | 'admin' | 'owner';
}

export const CheckOwnership = (
  resource: OwnershipMeta['resource'],
  param: string,
  access: OwnershipMeta['access'] = 'read',
) => SetMetadata(OWNERSHIP_KEY, { resource, param, access } satisfies OwnershipMeta);
