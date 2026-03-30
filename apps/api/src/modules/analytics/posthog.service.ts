import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';
import type {
  AnalyticsEventName,
  PublicPageViewProps,
  PublicLinkClickProps,
  SmartLinkResolvedProps,
  FanCaptureSubmitProps,
  OnboardingCompletedProps,
  ArtistProfileUpdatedProps,
  BlockLifecycleProps,
} from '@stagelink/types';

/** Union of all typed event property shapes. */
type EventProps =
  | PublicPageViewProps
  | PublicLinkClickProps
  | SmartLinkResolvedProps
  | FanCaptureSubmitProps
  | OnboardingCompletedProps
  | ArtistProfileUpdatedProps
  | BlockLifecycleProps;

/**
 * PostHogService — fire-and-forget server-side analytics via posthog-node.
 *
 * Design principles:
 *   - Never awaited by callers — uses void + .catch() internally.
 *   - Never throws — failures are logged and silently dropped.
 *   - Disabled automatically when POSTHOG_KEY is not set (local dev, CI).
 *   - Uses `$process_person_profiles: false` — we track events, not people,
 *     to avoid creating user profiles in PostHog from public page events.
 *
 * Usage:
 *   this.posthog.capture('smart_link_resolved', distinctId, props);
 *
 * The `distinctId` for unauthenticated events is the artist_id (stable, not
 * a visitor ID). This groups anonymous events by artist for dashboards.
 * For authenticated events it is the actor's user ID.
 */
@Injectable()
export class PostHogService implements OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private readonly client: PostHog | null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('POSTHOG_KEY');
    const host = this.config.get<string>('POSTHOG_HOST') ?? 'https://app.posthog.com';

    if (key) {
      this.client = new PostHog(key, {
        host,
        // Flush immediately in serverless/short-lived processes.
        // For long-lived NestJS processes the default batching is fine,
        // but explicit flushAt keeps latency predictable.
        flushAt: 1,
        flushInterval: 0,
      });
      this.logger.log(`PostHog initialized (host: ${host})`);
    } else {
      this.client = null;
      this.logger.warn('POSTHOG_KEY not set — analytics disabled');
    }
  }

  /**
   * Captures a typed analytics event. Fire-and-forget — never awaited.
   *
   * @param event      Event name constant from ANALYTICS_EVENTS
   * @param distinctId Stable identifier: artist_id for public events,
   *                   user_id for authenticated dashboard events.
   * @param props      Strongly-typed property bag for this event.
   */
  capture(event: AnalyticsEventName, distinctId: string, props: EventProps): void {
    if (!this.client) return;

    try {
      // posthog-node capture() is synchronous — it queues the event for batching.
      // It returns void; errors are surfaced via the SDK's internal error handler.
      this.client.capture({
        distinctId,
        event,
        properties: {
          ...props,
          // Opt out of profile creation for public/anonymous events.
          // Authenticated events may override this per-event if needed.
          $process_person_profiles: false,
        },
      });
    } catch (err: unknown) {
      // Extremely unlikely (SDK doesn't throw on capture), but guards against
      // unexpected runtime failures — analytics must never crash the app.
      this.logger.error(
        `PostHog capture failed [${event}]: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Flush pending events and shut down the PostHog client on module teardown. */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}
