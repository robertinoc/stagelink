import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';

export interface UpdatePageDto {
  title?: string;
  isPublished?: boolean;
}

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
  ) {}

  async findByArtist(artistId: string, userId: string) {
    await this.membershipService.validateAccess(userId, artistId, 'read');
    return this.prisma.page.findMany({
      where: { artistId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(pageId: string, dto: UpdatePageDto, userId: string, ipAddress?: string) {
    const artistId = await this.membershipService.resolveArtistIdForResource('page', pageId);
    if (!artistId) throw new NotFoundException('Page not found');

    await this.membershipService.validateAccess(userId, artistId, 'write');

    const page = await this.prisma.page.update({
      where: { id: pageId },
      data: dto,
    });

    this.auditService.log({
      actorId: userId,
      action: 'page.update',
      entityType: 'page',
      entityId: pageId,
      metadata: { changes: dto },
      ipAddress,
    });

    return page;
  }
}
