import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import {
  ANALYTICS_RANGES,
  RANGE_DAYS,
  type AnalyticsRange,
  type AnalyticsOverviewDto,
  type TopLinkDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns aggregated analytics for an artist over a preset date range.
   *
   * Data quality: basic — raw counts from analytics_events with UA-level bot
   * filtering at ingestion. No IP deduplication (unique visitor counting is T4-4).
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

    const [pageViews, linkClicks, smartLinkResolutions, topLinksRaw] = await Promise.all([
      // 1. Page views
      this.prisma.analyticsEvent.count({
        where: { artistId, eventType: 'page_view', createdAt: { gte: rangeStart } },
      }),

      // 2. Link clicks
      this.prisma.analyticsEvent.count({
        where: { artistId, eventType: 'link_click', createdAt: { gte: rangeStart } },
      }),

      // 3. Smart link resolutions
      this.prisma.analyticsEvent.count({
        where: {
          artistId,
          eventType: 'smart_link_resolution',
          createdAt: { gte: rangeStart },
        },
      }),

      // 4. Top links — group by linkItemId, ordered by click count desc
      this.prisma.analyticsEvent.groupBy({
        by: ['linkItemId', 'label', 'blockId', 'isSmartLink', 'smartLinkId'],
        where: {
          artistId,
          eventType: 'link_click',
          createdAt: { gte: rangeStart },
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
        dataQuality: 'basic',
        botFilteringApplied: true, // UA-pattern filtering applied at ingestion
        deduplicationApplied: false, // unique visitor dedup is T4-4
      },
    };
  }
}
