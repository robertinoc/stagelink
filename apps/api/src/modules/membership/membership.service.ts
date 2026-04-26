import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { type ArtistRole } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';

export type AccessLevel = 'read' | 'write' | 'admin' | 'owner';

const ROLE_WEIGHTS: Record<ArtistRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

const ACCESS_WEIGHTS: Record<AccessLevel, number> = {
  read: 1,
  write: 2,
  admin: 3,
  owner: 4,
};

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that userId has at least the required access level on artistId.
   * Throws ForbiddenException or NotFoundException as appropriate.
   * Returns the membership if valid.
   *
   * Note: always throws NotFoundException (not 403) when no membership exists
   * to avoid resource enumeration — attacker shouldn't know if artistId exists.
   */
  async validateAccess(userId: string, artistId: string, required: AccessLevel = 'read') {
    const membership = await this.prisma.artistMembership.findUnique({
      where: { artistId_userId: { artistId, userId } },
    });

    if (!membership) {
      throw new NotFoundException('Artist not found');
    }

    const roleWeight = ROLE_WEIGHTS[membership.role] ?? 0;
    const requiredWeight = ACCESS_WEIGHTS[required];

    if (roleWeight < requiredWeight) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }

  /**
   * Returns all artist IDs the user is a member of (any role).
   */
  async getArtistIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.prisma.artistMembership.findMany({
      where: { userId },
      select: { artistId: true },
    });
    return memberships.map((m) => m.artistId);
  }

  /**
   * Resolves artistId from a resource type + resource id.
   * Used by OwnershipGuard to find the parent artist before calling validateAccess.
   * Returns null if resource not found (guard will throw 404).
   */
  async resolveArtistIdForResource(
    resource: 'artist' | 'page' | 'block' | 'smartLink',
    id: string,
  ): Promise<string | null> {
    switch (resource) {
      case 'artist':
        return id;

      case 'page': {
        const page = await this.prisma.page.findUnique({
          where: { id },
          select: { artistId: true },
        });
        return page?.artistId ?? null;
      }

      case 'block': {
        const block = await this.prisma.block.findUnique({
          where: { id },
          select: { page: { select: { artistId: true } } },
        });
        return block?.page.artistId ?? null;
      }

      case 'smartLink': {
        const smartLink = await this.prisma.smartLink.findUnique({
          where: { id },
          select: { artistId: true },
        });
        return smartLink?.artistId ?? null;
      }

      default:
        return null;
    }
  }
}
