import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { PostHogService } from '../analytics/posthog.service';
import { EmailService } from '../email/email.service';
import { ANALYTICS_EVENTS, type EmailCaptureBlockConfig } from '@stagelink/types';
import type { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { resolveTrafficFlags } from '../../common/utils/analytics-flags';

/**
 * Hashes an IP address with SHA-256 for privacy-preserving storage.
 * Enables deduplication without persisting raw PII.
 */
function hashIp(ip: string | undefined): string {
  return createHash('sha256')
    .update(ip ?? 'unknown')
    .digest('hex');
}

// Fallback text used when the block has no custom consentLabel.
// Must match the i18n key `blocks.renderer.email_capture.consent_default`
// in the frontend message files so the audit record is accurate.
const DEFAULT_CONSENT_LABEL = 'I agree to receive updates from this artist.';

/**
 * PublicSubscribeService — handles fan email capture subscriptions.
 *
 * Extracted from PublicPagesService (SRP): page loading and subscription
 * persistence are independent concerns.
 *
 * All operations are scoped to the block's owning artist — the client
 * never sends artistId; it is derived server-side from block → page → artist.
 */
@Injectable()
export class PublicSubscribeService {
  private readonly logger = new Logger(PublicSubscribeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly posthog: PostHogService,
    private readonly email: EmailService,
  ) {}

  /**
   * Stores a fan's email subscription for a published email_capture block.
   *
   * Flow:
   *   1. Honeypot check — silently succeed if `website` field is non-empty
   *   2. Load block — verify exists, is published, has a page, and is email_capture type
   *   3. Consent check — if block.config.requireConsent=true, consent must be true
   *   4. Persist subscriber — single INSERT with P2002 catch for idempotency
   *   5. Fire analytics events (PostHog + local DB) — fire-and-forget
   *
   * @throws NotFoundException             if block doesn't exist, isn't published, or has no page
   * @throws UnprocessableEntityException  if block type doesn't accept subscriptions
   * @throws BadRequestException           if consent is required but not given
   */
  async createSubscriber(
    blockId: string,
    dto: CreateSubscriberDto,
    ip?: string,
    qualityCtx?: { userAgent?: string; slQa?: string; slAc?: string; slInternal?: string },
  ): Promise<{ created: boolean }> {
    // 1. Honeypot — non-empty website field signals a bot. Silently succeed.
    if (dto.website && dto.website.trim().length > 0) {
      return { created: false };
    }

    // 2. Load block with config and page context (including artist contact email)
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      select: {
        type: true,
        isPublished: true,
        config: true,
        page: {
          select: {
            id: true,
            artistId: true,
            artist: {
              select: {
                username: true,
                displayName: true,
                contactEmail: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!block || !block.isPublished || !block.page) {
      throw new NotFoundException('Block not found');
    }

    if (block.type !== 'email_capture') {
      throw new UnprocessableEntityException('Block does not accept email subscriptions');
    }

    // Double cast via unknown: block.config is Prisma JsonValue, not EmailCaptureBlockConfig
    const config = block.config as unknown as EmailCaptureBlockConfig;
    const artistId = block.page.artistId;
    const pageId = block.page.id;
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 3. Consent enforcement
    if (config.requireConsent === true && !dto.consent) {
      throw new BadRequestException('Consent is required to subscribe');
    }

    const consentGiven = dto.consent === true;

    // Capture the exact consent label shown at submit time for audit purposes.
    // Falls back to the i18n default text when no custom label is configured,
    // so the consent record is always non-null when the user agreed.
    const consentText = consentGiven ? (config.consentLabel ?? DEFAULT_CONSENT_LABEL) : null;

    // 4. Persist subscriber (idempotent via unique constraint catch)
    //
    // Single DB round-trip: attempt the INSERT directly. If a concurrent request
    // already inserted the same artistId+email (P2002 unique constraint), treat
    // it as a duplicate and return success without re-inserting.
    // This eliminates the TOCTOU race condition of findUnique + create.
    try {
      await this.prisma.subscriber.create({
        data: {
          artistId,
          blockId,
          pageId,
          email: normalizedEmail,
          consent: consentGiven,
          consentText,
          ipHash: ip ? hashIp(ip) : null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        // Duplicate artistId+email — idempotent success.
        return { created: false };
      }
      throw e;
    }

    // 5. Analytics — fire-and-forget (never block the response)
    // T4-4: Resolve quality flags for this request.
    const flags = resolveTrafficFlags({
      userAgent: qualityCtx?.userAgent,
      slQaHeader: qualityCtx?.slQa,
      slAcHeader: qualityCtx?.slAc,
      slInternalHeader: qualityCtx?.slInternal,
    });

    const eventProps = {
      artist_id: artistId,
      username: block.page.artist.username,
      environment: flags.environment,
      page_id: pageId,
      block_id: blockId,
      success: true,
    };

    // PostHog (external) — only fire when consent was explicitly given.
    if (flags.hasTrackingConsent === true) {
      this.posthog.capture(ANALYTICS_EVENTS.FAN_CAPTURE_SUBMITTED, artistId, eventProps);
    }

    // Local DB event — source of truth for the analytics dashboard fan-capture counter.
    // Gate: record unless consent was explicitly REFUSED (sl_ac=0).
    //   hasTrackingConsent=true  → visitor accepted cookies → record
    //   hasTrackingConsent=null  → header absent (visitor hasn't set cookie yet,
    //                              or frontend didn't forward it) → still record;
    //                              an explicit subscription action implies the
    //                              visitor is engaged and the artist deserves the count
    //   hasTrackingConsent=false → visitor refused cookies → skip (respect refusal)
    // analytics_events.ip_hash is NOT NULL (schema constraint) — use hashIp(undefined)
    // = SHA256('unknown') when IP is unavailable.
    if (flags.hasTrackingConsent !== false) {
      this.prisma.analyticsEvent
        .create({
          data: {
            artistId,
            blockId,
            eventType: EventType.fan_capture_submit,
            ipHash: ip ? hashIp(ip) : hashIp(undefined),
            ...flags,
          },
        })
        .catch(() => {});
    }

    // 6. Notify artist by email — fire-and-forget (never block the response)
    const artist = block.page.artist;
    const artistEmail = artist.contactEmail ?? artist.user?.email ?? null;
    if (artistEmail) {
      const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://stagelink.art';
      const dashboardUrl = `${appUrl}/en/dashboard/fans`;
      const artistName = artist.displayName ?? artist.username ?? 'your page';
      this.email
        .sendFanSubscribedNotification(artistEmail, normalizedEmail, artistName, dashboardUrl)
        .catch((err: unknown) => {
          this.logger.warn(`Fan subscription notification email failed: ${String(err)}`);
        });
    }

    return { created: true };
  }
}
