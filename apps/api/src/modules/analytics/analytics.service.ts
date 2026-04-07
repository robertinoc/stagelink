import { Injectable } from '@nestjs/common';
import { AnalyticsEnvironment, Prisma } from '@prisma/client';
import type { EmailCaptureBlockConfig } from '@stagelink/types';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { PrismaService } from '../../lib/prisma.service';
import {
  ANALYTICS_RANGES,
  RANGE_DAYS,
  type AnalyticsFanInsightsDto,
  type AnalyticsNotesDto,
  type AnalyticsOverviewDto,
  type AnalyticsProTrendsDto,
  type AnalyticsRange,
  type AnalyticsSmartLinkPerformanceDto,
  type AnalyticsTrendPointDto,
  type SmartLinkPerformanceItemDto,
  type TopCaptureBlockDto,
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
 * NOTE — isInternal is intentionally absent until the preview flow forwards
 * the X-SL-Internal header from the web tier.
 *
 * NOTE — hasTrackingConsent is intentionally absent. StageLink's first-party
 * aggregate analytics remain legitimate-interest metrics for the artist, and
 * excluding opted-out traffic here would undercount real engagement.
 */
const QUALITY_FILTER = {
  isBotSuspected: false,
  isQa: false,
  environment: AnalyticsEnvironment.production,
} as const;

interface TrendRow {
  day: Date;
  pageViews: number;
  linkClicks: number;
  smartLinkResolutions: number;
}

interface FanCaptureTrendRow {
  day: Date;
  captures: number;
}

function resolveRange(rawRange?: string): AnalyticsRange {
  return ANALYTICS_RANGES.includes(rawRange as AnalyticsRange)
    ? (rawRange as AnalyticsRange)
    : '30d';
}

function buildRangeStart(range: AnalyticsRange): Date {
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - RANGE_DAYS[range]);
  return rangeStart;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundDecimal(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function buildNotes(): AnalyticsNotesDto {
  return {
    dataQuality: 'standard',
    botFilteringApplied: true,
    deduplicationApplied: false,
    qualityFlagsApplied: true,
    filtersActive: ['isBotSuspected=false', 'isQa=false', 'environment=production'],
  };
}

function buildDateSeries(rangeStart: Date): string[] {
  const start = new Date(
    Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), rangeStart.getUTCDate()),
  );
  const end = new Date();
  const endDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const dates: string[] = [];

  while (start <= endDate) {
    dates.push(toIsoDate(start));
    start.setUTCDate(start.getUTCDate() + 1);
  }

  return dates;
}

function mapTrendSeries(
  dates: string[],
  rows: TrendRow[],
  key: keyof Omit<TrendRow, 'day'>,
): AnalyticsTrendPointDto[] {
  const valueByDate = new Map(rows.map((row) => [toIsoDate(row.day), row[key]]));
  return dates.map((date) => ({
    date,
    value: valueByDate.get(date) ?? 0,
  }));
}

function mapCaptureSeries(dates: string[], rows: FanCaptureTrendRow[]): AnalyticsTrendPointDto[] {
  const valueByDate = new Map(rows.map((row) => [toIsoDate(row.day), row.captures]));
  return dates.map((date) => ({
    date,
    value: valueByDate.get(date) ?? 0,
  }));
}

function resolveCaptureBlockLabel(block: {
  id: string;
  title: string | null;
  type: string;
  config: Prisma.JsonValue;
}): string {
  if (block.title?.trim()) {
    return block.title.trim();
  }

  if (block.type === 'email_capture') {
    const config = block.config as EmailCaptureBlockConfig | null;
    if (config?.headline?.trim()) {
      return config.headline.trim();
    }
  }

  return `Block ${block.id.slice(-6)}`;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
  ) {}

  async getOverview(artistId: string, rawRange?: string): Promise<AnalyticsOverviewDto> {
    const range = resolveRange(rawRange);

    if (range === '365d') {
      await this.billingEntitlementsService.assertFeatureAccess(artistId, 'analytics_pro');
    }

    const rangeStart = buildRangeStart(range);
    const baseWhere = { artistId, createdAt: { gte: rangeStart }, ...QUALITY_FILTER };

    const [pageViews, linkClicks, smartLinkResolutions, topLinksRaw] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'page_view' },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'link_click' },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'smart_link_resolution' },
      }),
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

    const ctr = pageViews > 0 ? roundDecimal(linkClicks / pageViews) : 0;
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
      notes: buildNotes(),
    };
  }

  async getProTrends(artistId: string, rawRange?: string): Promise<AnalyticsProTrendsDto> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'analytics_pro');

    const range = resolveRange(rawRange);
    const rangeStart = buildRangeStart(range);
    const dates = buildDateSeries(rangeStart);

    const rows = await this.prisma.$queryRaw<TrendRow[]>(Prisma.sql`
      SELECT
        date_trunc('day', created_at) AS day,
        COUNT(*) FILTER (WHERE event_type::text = 'page_view')::int AS "pageViews",
        COUNT(*) FILTER (WHERE event_type::text = 'link_click')::int AS "linkClicks",
        COUNT(*) FILTER (WHERE event_type::text = 'smart_link_resolution')::int AS "smartLinkResolutions"
      FROM analytics_events
      WHERE artist_id = ${artistId}
        AND created_at >= ${rangeStart}
        AND is_bot_suspected = false
        AND is_qa = false
        AND environment::text = 'production'
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    return {
      artistId,
      range,
      series: {
        pageViews: mapTrendSeries(dates, rows, 'pageViews'),
        linkClicks: mapTrendSeries(dates, rows, 'linkClicks'),
        smartLinkResolutions: mapTrendSeries(dates, rows, 'smartLinkResolutions'),
      },
      notes: buildNotes(),
    };
  }

  async getSmartLinkPerformance(
    artistId: string,
    rawRange?: string,
  ): Promise<AnalyticsSmartLinkPerformanceDto> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'analytics_pro');

    const range = resolveRange(rawRange);
    const rangeStart = buildRangeStart(range);
    const baseWhere = {
      artistId,
      createdAt: { gte: rangeStart },
      ...QUALITY_FILTER,
      isSmartLink: true,
      smartLinkId: { not: null },
    };

    const [clickRows, resolutionRows] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['smartLinkId'],
        where: {
          ...baseWhere,
          eventType: 'link_click',
        },
        _count: { id: true },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['smartLinkId'],
        where: {
          ...baseWhere,
          eventType: 'smart_link_resolution',
        },
        _count: { id: true },
      }),
    ]);

    const smartLinkIds = [
      ...new Set([...clickRows, ...resolutionRows].map((row) => row.smartLinkId)),
    ].filter((id): id is string => Boolean(id));

    const smartLinks =
      smartLinkIds.length > 0
        ? await this.prisma.smartLink.findMany({
            where: { artistId, id: { in: smartLinkIds } },
            select: { id: true, label: true },
          })
        : [];

    const clicksById = new Map(
      clickRows
        .filter((row) => row.smartLinkId)
        .map((row) => [row.smartLinkId as string, row._count.id]),
    );
    const resolutionsById = new Map(
      resolutionRows
        .filter((row) => row.smartLinkId)
        .map((row) => [row.smartLinkId as string, row._count.id]),
    );
    const labelsById = new Map(smartLinks.map((smartLink) => [smartLink.id, smartLink.label]));

    const items: SmartLinkPerformanceItemDto[] = smartLinkIds
      .map((smartLinkId) => ({
        smartLinkId,
        label: labelsById.get(smartLinkId) ?? `Smart Link ${smartLinkId.slice(-6)}`,
        clicks: clicksById.get(smartLinkId) ?? 0,
        resolutions: resolutionsById.get(smartLinkId) ?? 0,
      }))
      .sort((a, b) => {
        if (b.resolutions !== a.resolutions) return b.resolutions - a.resolutions;
        return b.clicks - a.clicks;
      })
      .slice(0, 10);

    return {
      artistId,
      range,
      items,
      notes: buildNotes(),
    };
  }

  async getFanInsights(artistId: string, rawRange?: string): Promise<AnalyticsFanInsightsDto> {
    await this.billingEntitlementsService.assertFeatureAccess(artistId, 'advanced_fan_insights');

    const range = resolveRange(rawRange);
    const rangeStart = buildRangeStart(range);
    const dates = buildDateSeries(rangeStart);
    const baseWhere = { artistId, createdAt: { gte: rangeStart }, ...QUALITY_FILTER };

    const [pageViews, fanCaptures, captureRows, topCaptureBlocksRaw] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'page_view' },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...baseWhere, eventType: 'fan_capture_submit' },
      }),
      this.prisma.$queryRaw<FanCaptureTrendRow[]>(Prisma.sql`
        SELECT
          date_trunc('day', created_at) AS day,
          COUNT(*)::int AS captures
        FROM analytics_events
        WHERE artist_id = ${artistId}
          AND created_at >= ${rangeStart}
          AND event_type::text = 'fan_capture_submit'
          AND is_bot_suspected = false
          AND is_qa = false
          AND environment::text = 'production'
        GROUP BY 1
        ORDER BY 1 ASC
      `),
      this.prisma.analyticsEvent.groupBy({
        by: ['blockId'],
        where: {
          ...baseWhere,
          eventType: 'fan_capture_submit',
          blockId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const blockIds = topCaptureBlocksRaw
      .map((row) => row.blockId)
      .filter((blockId): blockId is string => Boolean(blockId));

    const blocks =
      blockIds.length > 0
        ? await this.prisma.block.findMany({
            where: { id: { in: blockIds } },
            select: { id: true, title: true, type: true, config: true },
          })
        : [];

    const blocksById = new Map(blocks.map((block) => [block.id, block]));
    const topCaptureBlocks: TopCaptureBlockDto[] = topCaptureBlocksRaw
      .filter((row) => row.blockId)
      .map((row) => {
        const block = blocksById.get(row.blockId as string);
        return {
          blockId: row.blockId as string,
          label: block
            ? resolveCaptureBlockLabel(block)
            : `Block ${(row.blockId as string).slice(-6)}`,
          captures: row._count.id,
        };
      });

    return {
      artistId,
      range,
      summary: {
        pageViews,
        fanCaptures,
        fanCaptureRate: pageViews > 0 ? roundDecimal(fanCaptures / pageViews) : 0,
      },
      capturesOverTime: mapCaptureSeries(dates, captureRows),
      topCaptureBlocks,
      notes: {
        ...buildNotes(),
        captureRateFormula: 'fan_capture_submit / page_view',
        piiIncluded: false,
      },
    };
  }
}
