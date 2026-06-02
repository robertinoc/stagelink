import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { OnboardingEmailsService } from '../onboarding-emails/onboarding-emails.service';

export interface UpdatePageDto {
  title?: string;
  isPublished?: boolean;
  theme?: Record<string, unknown>;
}

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly onboardingEmails: OnboardingEmailsService,
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

    // Detect first-time publish before applying the update.
    let wasUnpublished = false;
    if (dto.isPublished === true) {
      const current = await this.prisma.page.findUnique({
        where: { id: pageId },
        select: { isPublished: true },
      });
      wasUnpublished = current?.isPublished === false;
    }

    const { theme, ...rest } = dto;
    const data: Prisma.PageUpdateInput = {
      ...rest,
      ...(theme !== undefined && { theme: theme as Prisma.InputJsonValue }),
    };

    const page = await this.prisma.page.update({
      where: { id: pageId },
      data,
    });

    this.auditService.log({
      actorId: userId,
      action: 'page.update',
      entityType: 'page',
      entityId: pageId,
      metadata: { changes: dto },
      ipAddress,
    });

    // Fire activation email on first-time publish — fire-and-forget.
    // OnboardingEmailsService is idempotent: it skips if already sent.
    if (wasUnpublished) {
      this.onboardingEmails.sendActivationEmail(artistId).catch(() => {});
    }

    return page;
  }
}
