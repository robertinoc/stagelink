import { Injectable } from '@nestjs/common';
import { AnalyticsEnvironment } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import {
  ANALYTICS_RANGES,
  RANGE_DAYS,
  type AnalyticsRange,
  type AnalyticsOverviewDto,
  type TopLinkDto,
} from './dto/analytics-response.dto';

/**
 * T4-4 clean event filter — applied to all aggregation queries.
 *
 * Excludes:
 *   - Bot-suspected events (isBotSuspected = true)
 *   - QA-tagged events (isQa = true)
 *   - Non-production environments
 *
 * Raw events are always persisted with flags; this filter runs only at
 * query time so historical data can be re-queried with stricter or looser
 * criteria without re-processing the event log.
 *
 * NOTE — isInternal is intentionally absent from this filter.
 * The X-SL-Internal header that sets isInternal is not yet forwarded by the
 * web tier (the dashboard "Preview page" feature is unimplemented). Until that
 * ships, isInternal is always false, and including it here would be a no-op
 * that misleads future contributors into thinking internal filtering is active.
 * Re-add `isInternal: false` when the preview feature is implemented.
 *
 * NOTE — hasTrackingConsent is intentionally absent from this filter.
 * Basic aggregate analytics (page views, link clicks) run under legitimate
 * interest for the artist — no cross-site tracking, no advertising profiles.
 * The hasTrackingConsent column is persisted for audit/transparency only.
 * Do NOT add `hasTrackingConsent: true` here — that would silently exclude
 * opted-out fan traffic and undercount the artist's real engagement metrics.
 */
const QUALITY_FILTER = {
  isBotSuspected: false,
  isQa: false,
  environment: AnalyticsEnvironment.production,
} as const;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns aggregated analytics for an artist over a preset date range.
   *
   * Data quality: T4-4 — events are filtered at query time by quality flags.
   * Only production, non-bot, non-internal, non-QA events are counted.
   *
   * Authorization is enforced at the controller layer (OwnershipGuard).
   *
   * @param artistId Validated artist UUID (caller must have verified membership).
   * @param rawRange Preset string: '7d' | '30d' | '90d'. Falls back to '30d'.
   */
  async getOverview(artistId: string, rawRange?: string): Promise<AnalyticsOverviewDto> {
    const range: AnalyticsRange = ANALYTICS_RANGES.includes(rawRange as AnalyticsRange)
      ? (rawRange as AnalyticsRange)
      : '30d';

    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - RANGE_DAYS[range]);

    // Base where clause: artist + time range + quality flags
    const baseWhere = { artistId, createdAt: { gte: rangeStart }, ...QUALITY_FILTER };

    const [pageViews, linkClicks, smartLinkResolutions, topLinksRaw] = await Promise.all([
      // 1. Page views
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'page_view' },
      }),

      // 2. Link clicks
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'link_click' },
      }),

      // 3. Smart link resolutions
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'smart_link_resolution' },
      }),

      // 4. Top links — group by linkItemId, ordered by click count desc
      this.prisma.analyticsEvent.groupBy({
        by: ['linkItemId', 'label', 'blockId', 'isSmartLink', 'smartLinkId'],
        where: {
          ...baseWhere,
          eventType: 'link_click',
          linkItemId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const ctr = pageViews > 0 ? Math.round((linkClicks / pageViews) * 10000) / 10000 : 0;

    const topLinks: TopLinkDto[] = topLinksRaw.map((row) => ({
      linkItemId: row.linkItemId ?? '',
      label: row.label,
      blockId: row.blockId,
      clicks: row._count.id,
      isSmartLink: row.isSmartLink,
      smartLinkId: row.smartLinkId,
    }));

    return {
      artistId,
      range,
      summary: {
        pageViews,
        linkClicks,
        ctr,
        smartLinkResolutions,
      },
      topLinks,
      notes: {
        dataQuality: 'standard',
        botFilteringApplied: true,
        deduplicationApplied: false, // IP-level unique visitor dedup is a future milestone
        qualityFlagsApplied: true,
        filtersActive: [
          'isBotSuspected=false',
          // isInternal not yet active — X-SL-Internal header unimplemented in web tier
          'isQa=false',
          'environment=production',
        ],
      },
    };
  }
}
