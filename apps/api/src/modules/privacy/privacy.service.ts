import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { DeleteAccountDto, UpdatePersonalDataDto } from './dto';

type ExportArtist = Prisma.ArtistGetPayload<{
  include: {
    page: { include: { blocks: true } };
    epk: true;
    assets: true;
    smartLinks: true;
    subscription: true;
    customDomains: true;
    shopifyConnection: true;
    merchProviderConnection: true;
    insightsConnections: true;
    insightsSnapshots: true;
    subscribers: true;
    memberships: true;
  };
}>;

@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async exportUserData(user: User, ipAddress?: string) {
    const request = await this.createDsarRequest(user.id, 'access', {
      delivery: 'direct_json_response',
    });

    const [userRecord, memberships, ownedArtists, auditLogs] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isSuspended: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.artistMembership.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.artist.findMany({
        where: { memberships: { some: { userId: user.id } } },
        include: {
          page: { include: { blocks: { orderBy: { position: 'asc' } } } },
          epk: true,
          assets: true,
          smartLinks: true,
          subscription: true,
          customDomains: true,
          shopifyConnection: true,
          merchProviderConnection: true,
          insightsConnections: true,
          insightsSnapshots: { orderBy: { capturedAt: 'desc' }, take: 50 },
          subscribers: { orderBy: { createdAt: 'desc' } },
          memberships: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        where: { actorId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    const exportPayload = {
      export: {
        generatedAt: new Date().toISOString(),
        formatVersion: '2026-05-dsar-v1',
        requestId: request.id,
        scope:
          'Authenticated StageLink account data, artist workspace data, public page/EPK data, platform metadata, and recent audit activity.',
      },
      account: userRecord,
      memberships,
      artists: ownedArtists.map((artist) => sanitizeArtistForExport(artist)),
      consent: {
        note: 'Cookie consent is stored client-side in the sl_consent cookie and can be changed from the Privacy control in the app.',
        serverStoredConsent:
          'Fan capture consent is included under artists[].subscribers where applicable.',
      },
      auditActivity: auditLogs,
      retainedElsewhere: [
        'Stripe may retain legally required billing/payment records in Stripe systems.',
        'WorkOS may retain identity/security logs according to WorkOS retention policies.',
        'Infrastructure providers may retain operational logs for a limited period.',
      ],
    };

    await this.completeDsarRequest(request.id, {
      artistCount: ownedArtists.length,
      auditLogCount: auditLogs.length,
    });

    this.auditService.log({
      actorId: user.id,
      action: 'privacy.dsar.export',
      entityType: 'user',
      entityId: user.id,
      metadata: { requestId: request.id, artistCount: ownedArtists.length },
      ipAddress,
    });

    return exportPayload;
  }

  async updatePersonalData(user: User, dto: UpdatePersonalDataDto, ipAddress?: string) {
    const fields = [
      ...(dto.firstName !== undefined ? ['firstName'] : []),
      ...(dto.lastName !== undefined ? ['lastName'] : []),
    ];

    if (fields.length === 0) {
      throw new BadRequestException('No personal data fields were provided');
    }

    const request = await this.createDsarRequest(user.id, 'rectification', { fields });
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName || null }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName || null }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isSuspended: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.completeDsarRequest(request.id, { fields });

    this.auditService.log({
      actorId: user.id,
      action: 'privacy.dsar.rectification',
      entityType: 'user',
      entityId: user.id,
      metadata: { requestId: request.id, fields },
      ipAddress,
    });

    return { user: updated, requestId: request.id };
  }

  async deleteAccount(user: User, dto: DeleteAccountDto, ipAddress?: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!currentUser || currentUser.deletedAt !== null) {
      throw new NotFoundException('Account not found');
    }

    if (dto.confirmEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new ForbiddenException('Email confirmation does not match the authenticated account');
    }

    const request = await this.createDsarRequest(user.id, 'erasure', {
      strategy: 'anonymize_user_delete_owned_artist_workspaces',
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const memberships = await tx.artistMembership.findMany({
        where: { userId: user.id },
        include: {
          artist: {
            select: {
              id: true,
              username: true,
              memberships: { select: { userId: true, role: true } },
            },
          },
        },
      });

      const affectedUsernames = memberships
        .map((membership) => membership.artist.username)
        .filter(
          (username): username is string => typeof username === 'string' && username.length > 0,
        );
      const deletedArtistIds: string[] = [];
      const removedMembershipArtistIds: string[] = [];

      for (const membership of memberships) {
        const otherOwners = membership.artist.memberships.filter(
          (m) => m.userId !== user.id && m.role === 'owner',
        );
        const isSoleOwner = membership.role === 'owner' && otherOwners.length === 0;

        if (isSoleOwner) {
          await tx.subscriber.deleteMany({ where: { artistId: membership.artistId } });
          await tx.artist.delete({ where: { id: membership.artistId } });
          deletedArtistIds.push(membership.artistId);
        } else {
          await tx.artistMembership.delete({
            where: { artistId_userId: { artistId: membership.artistId, userId: user.id } },
          });
          removedMembershipArtistIds.push(membership.artistId);
        }
      }

      const anonymizedEmail = `deleted-${user.id}@deleted.stagelink.local`;
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: anonymizedEmail,
          firstName: null,
          lastName: null,
          avatarUrl: null,
          isSuspended: true,
          deletedAt: new Date(),
        },
      });

      await tx.dsarRequest.update({
        where: { id: request.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            strategy: 'anonymize_user_delete_owned_artist_workspaces',
            deletedArtistCount: deletedArtistIds.length,
            removedMembershipCount: removedMembershipArtistIds.length,
          },
        },
      });

      return { deletedArtistIds, removedMembershipArtistIds, affectedUsernames };
    });

    this.auditService.log({
      actorId: null,
      action: 'privacy.dsar.erasure.completed',
      entityType: 'user',
      entityId: user.id,
      metadata: {
        requestId: request.id,
        deletedArtistCount: result.deletedArtistIds.length,
        removedMembershipCount: result.removedMembershipArtistIds.length,
      },
      ipAddress,
    });

    return {
      requestId: request.id,
      status: 'completed',
      deletedUsername: result.affectedUsernames[0] ?? null,
      deletedArtistCount: result.deletedArtistIds.length,
      removedMembershipCount: result.removedMembershipArtistIds.length,
      retained: [
        'Privacy-safe audit logs',
        'DSAR request record',
        'WorkOS user id tombstone retained locally to prevent deleted account reprovisioning',
        'External provider records subject to their own legal retention requirements',
      ],
    };
  }

  private async createDsarRequest(
    userId: string,
    requestType: 'access' | 'rectification' | 'erasure',
    metadata: Record<string, unknown>,
  ) {
    return this.prisma.dsarRequest.create({
      data: {
        userId,
        requestType,
        status: 'verified',
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  private async completeDsarRequest(id: string, metadata: Record<string, unknown>) {
    await this.prisma.dsarRequest.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}

function sanitizeArtistForExport(artist: ExportArtist) {
  return {
    ...artist,
    shopifyConnection: artist.shopifyConnection
      ? {
          ...artist.shopifyConnection,
          storefrontToken: '[redacted]',
        }
      : null,
    merchProviderConnection: artist.merchProviderConnection
      ? {
          ...artist.merchProviderConnection,
          apiToken: '[redacted]',
        }
      : null,
    insightsConnections: artist.insightsConnections.map((connection) => ({
      ...connection,
      accessToken: connection.accessToken ? '[redacted]' : null,
      refreshToken: connection.refreshToken ? '[redacted]' : null,
    })),
    assets: artist.assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      deliveryUrl: asset.deliveryUrl,
      status: asset.status,
      originalFilename: asset.originalFilename,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    })),
  };
}
