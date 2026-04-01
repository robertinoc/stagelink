import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import type { User, ArtistCategory } from '@prisma/client';
import { isReservedUsername } from '../../common/constants/reserved-usernames';
import { normalizeUsername, validateUsernameFormat } from '../../common/utils/username.util';
import { PrismaService } from '../../lib/prisma.service';
import { PostHogService } from '../analytics/posthog.service';
import { AuditService } from '../audit/audit.service';
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
    private readonly posthog: PostHogService,
  ) {}

  async checkUsername(rawValue: string): Promise<UsernameCheckResult> {
    const normalized = normalizeUsername(rawValue);

    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) {
      const reason = formatResult.reason;
      let code: UsernameCheckResult['reason'] = 'invalid_chars';
      if (reason.includes('at least')) code = 'too_short';
      else if (reason.includes('at most')) code = 'too_long';
      return { available: false, normalizedUsername: normalized, reason: code };
    }

    if (isReservedUsername(normalized)) {
      return { available: false, normalizedUsername: normalized, reason: 'reserved' };
    }

    const existing = await this.prisma.artist.findUnique({
      where: { username: normalized },
      select: { id: true },
    });

    if (existing) {
      return { available: false, normalizedUsername: normalized, reason: 'taken' };
    }

    return { available: true, normalizedUsername: normalized };
  }

  async completeOnboarding(
    dto: CompleteOnboardingDto,
    user: User,
    ipAddress?: string,
  ): Promise<OnboardingResult> {
    const existingCount = await this.prisma.artistMembership.count({
      where: { userId: user.id },
    });
    if (existingCount > 0) {
      throw new ConflictException('You already have an artist. Use the dashboard to manage it.');
    }

    const normalized = normalizeUsername(dto.username);
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) {
      throw new BadRequestException(formatResult.reason);
    }
    if (isReservedUsername(normalized)) {
      throw new BadRequestException(`Username "${normalized}" is reserved`);
    }

    const displayName = dto.displayName.trim();

    let result: { artistId: string; pageId: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const artist = await tx.artist.create({
          data: {
            userId: user.id,
            username: normalized,
            displayName,
            category: dto.category as ArtistCategory,
          },
        });

        const page = await tx.page.create({
          data: {
            artistId: artist.id,
            title: `${artist.displayName}'s Page`,
            isPublished: false,
          },
        });

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

    this.posthog.capture(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, user.id, {
      actor_user_id: user.id,
      artist_id: result.artistId,
      environment: process.env.NODE_ENV ?? 'development',
      username: normalized,
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
