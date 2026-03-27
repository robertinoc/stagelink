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
    // Guard: prevent creating more than one artist via onboarding endpoint
    const existingCount = await this.prisma.artistMembership.count({
      where: { userId: user.id },
    });
    if (existingCount > 0) {
      throw new ConflictException('You already have an artist. Use the dashboard to manage it.');
    }

    // Normalize and validate username
    const normalized = normalizeUsername(dto.username);
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) {
      throw new BadRequestException(formatResult.reason);
    }
    if (isReservedUsername(normalized)) {
      throw new BadRequestException(`Username "${normalized}" is reserved`);
    }

    const displayName = dto.displayName.trim();

    // Atomic transaction: create artist + page + membership
    let result: { artistId: string; pageId: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        // Create artist
        const artist = await tx.artist.create({
          data: {
            userId: user.id,
            username: normalized,
            displayName,
            category: dto.category as ArtistCategory,
          },
        });

        // Create initial page (unpublished)
        const page = await tx.page.create({
          data: {
            artistId: artist.id,
            title: `${artist.displayName}'s Page`,
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

    this.auditService.log({
      actorId: user.id,
      action: 'artist.onboarding.complete',
      entityType: 'artist',
      entityId: result.artistId,
      metadata: {
        username: normalized,
        displayName,
        category: dto.category,
      },
      ipAddress,
    });

    this.logger.log(
      `Onboarding complete: userId=${user.id} artistId=${result.artistId} username=${normalized}`,
    );

    return {
      artistId: result.artistId,
      username: normalized,
      displayName,
      pageId: result.pageId,
    };
  }
}
