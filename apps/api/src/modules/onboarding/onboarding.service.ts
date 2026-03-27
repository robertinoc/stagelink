import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { User, ArtistCategory } from '@prisma/client';
import { normalizeUsername, validateUsernameFormat } from '../../common/utils/username.util';
import { isReservedUsername } from '../../common/constants/reserved-usernames';
import type { CompleteOnboardingDto } from './dto';

export interface OnboardingResult {
  artistId: string;
  username: string;
  displayName: string;
  pageId: string;
}

export interface UsernameCheckResult {
  available: boolean;
  normalizedUsername: string;
  reason?: 'too_short' | 'too_long' | 'invalid_chars' | 'reserved' | 'taken';
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Checks if a username is available and valid.
   * Used for live debounced checks from the onboarding wizard.
   */
  async checkUsername(rawValue: string): Promise<UsernameCheckResult> {
    const normalized = normalizeUsername(rawValue);

    // Validate format (returns { valid, reason } — does not throw)
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) {
      const reason = formatResult.reason;
      let code: UsernameCheckResult['reason'] = 'invalid_chars';
      if (reason.includes('at least')) code = 'too_short';
      else if (reason.includes('at most')) code = 'too_long';
      return { available: false, normalizedUsername: normalized, reason: code };
    }

    // Check reserved usernames
    if (isReservedUsername(normalized)) {
      return { available: false, normalizedUsername: normalized, reason: 'reserved' };
    }

    // Check DB uniqueness
    const existing = await this.prisma.artist.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    if (existing) {
      return { available: false, normalizedUsername: normalized, reason: 'taken' };
    }

    return { available: true, normalizedUsername: normalized };
  }

  /**
   * Creates the initial artist for a user completing onboarding.
   * Atomically creates: artist + page + membership (owner) in a single transaction.
   * Optionally links a pre-uploaded avatar asset.
   */
  async completeOnboarding(
    dto: CompleteOnboardingDto,
    user: User,
    ipAddress?: string,
  ): Promise<OnboardingResult> {
    // Normalize and validate username
    const normalized = normalizeUsername(dto.username);
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) {
      throw new BadRequestException(formatResult.reason);
    }
    if (isReservedUsername(normalized)) {
      throw new BadRequestException(`Username "${normalized}" is reserved`);
    }

    // Validate optional assetId (must belong to this user and be uploaded)
    if (dto.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: dto.assetId },
        select: { id: true, createdByUserId: true, status: true },
      });
      if (!asset || asset.createdByUserId !== user.id) {
        throw new BadRequestException('Invalid asset reference');
      }
      if (asset.status !== 'uploaded') {
        throw new BadRequestException('Asset upload not confirmed yet');
      }
    }

    // Atomic transaction: create artist + page + membership
    let result: { artistId: string; pageId: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // Create artist
        const artist = await tx.artist.create({
          data: {
            userId: user.id,
            username: normalized,
            displayName: dto.displayName.trim(),
            category: dto.category as ArtistCategory,
          },
        });

        // Create initial page (unpublished)
        const page = await tx.page.create({
          data: {
            artistId: artist.id,
            title: `${dto.displayName.trim()}'s Page`,
            isPublished: false,
          },
        });

        // Create owner membership
        await tx.artistMembership.create({
          data: {
            artistId: artist.id,
            userId: user.id,
            role: 'owner',
          },
        });

        return { artistId: artist.id, pageId: page.id };
      });
    } catch (err: unknown) {
      // Handle username collision race condition
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === 'P2002') {
        throw new ConflictException(
          `Username "${normalized}" is already taken. Please choose another.`,
        );
      }
      throw err;
    }

    // Link avatar asset if provided (outside transaction — non-critical)
    if (dto.assetId) {
      try {
        const asset = await this.prisma.asset.findUnique({
          where: { id: dto.assetId },
          select: { deliveryUrl: true },
        });
        if (asset?.deliveryUrl) {
          await this.prisma.artist.update({
            where: { id: result.artistId },
            data: {
              avatarAssetId: dto.assetId,
              avatarUrl: asset.deliveryUrl,
            },
          });
          // Also update the asset with the newly created artistId
          await this.prisma.asset.update({
            where: { id: dto.assetId },
            data: { artistId: result.artistId },
          });
        }
      } catch (assetErr) {
        // Non-blocking: artist was created successfully, avatar linking failed
        this.logger.warn(
          `Failed to link avatar asset ${dto.assetId} to artist ${result.artistId}: ${assetErr instanceof Error ? assetErr.message : String(assetErr)}`,
        );
      }
    }

    this.auditService.log({
      actorId: user.id,
      action: 'artist.onboarding.complete',
      entityType: 'artist',
      entityId: result.artistId,
      metadata: {
        username: normalized,
        displayName: dto.displayName.trim(),
        category: dto.category,
        hasAvatar: !!dto.assetId,
      },
      ipAddress,
    });

    this.logger.log(
      `Onboarding complete: userId=${user.id} artistId=${result.artistId} username=${normalized}`,
    );

    return {
      artistId: result.artistId,
      username: normalized,
      displayName: dto.displayName.trim(),
      pageId: result.pageId,
    };
  }
}
