import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';

export interface CreateArtistDto {
  username: string;
  displayName: string;
  bio?: string;
}

export interface UpdateArtistDto {
  displayName?: string;
  bio?: string;
}

@Injectable()
export class ArtistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
  ) {}

  async findAllForUser(userId: string) {
    const artistIds = await this.membershipService.getArtistIdsForUser(userId);
    return this.prisma.artist.findMany({
      where: { id: { in: artistIds } },
      include: { memberships: { where: { userId }, select: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    await this.membershipService.validateAccess(userId, id, 'read');
    return this.prisma.artist.findUniqueOrThrow({ where: { id } });
  }

  async create(dto: CreateArtistDto, userId: string, ipAddress?: string) {
    // Check username uniqueness
    const existing = await this.prisma.artist.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(`Username "${dto.username}" is already taken`);
    }

    const artist = await this.prisma.$transaction(async (tx) => {
      const created = await tx.artist.create({
        data: {
          username: dto.username,
          displayName: dto.displayName,
          bio: dto.bio ?? null,
          userId,
        },
      });

      await tx.artistMembership.create({
        data: { artistId: created.id, userId, role: 'owner' },
      });

      return created;
    });

    this.auditService.log({
      actorId: userId,
      action: 'artist.create',
      entityType: 'artist',
      entityId: artist.id,
      metadata: { username: artist.username, displayName: artist.displayName },
      ipAddress,
    });

    return artist;
  }

  async update(id: string, dto: UpdateArtistDto, userId: string, ipAddress?: string) {
    await this.membershipService.validateAccess(userId, id, 'write');

    const artist = await this.prisma.artist.update({
      where: { id },
      data: dto,
    });

    this.auditService.log({
      actorId: userId,
      action: 'artist.update',
      entityType: 'artist',
      entityId: id,
      metadata: { changes: dto },
      ipAddress,
    });

    return artist;
  }

  async remove(id: string, userId: string, ipAddress?: string) {
    await this.membershipService.validateAccess(userId, id, 'owner');

    // Fetch before delete for audit log metadata (artist is guaranteed to exist at this point)
    const artist = await this.prisma.artist.findUniqueOrThrow({ where: { id } });

    await this.prisma.artist.delete({ where: { id } });

    this.auditService.log({
      actorId: userId,
      action: 'artist.delete',
      entityType: 'artist',
      entityId: id,
      metadata: { username: artist.username, displayName: artist.displayName },
      ipAddress,
    });
  }
}
