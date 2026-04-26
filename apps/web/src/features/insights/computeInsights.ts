/**
 * computeInsights.ts
 *
 * Pure, side-effect-free rule engine that turns raw dashboard data into a
 * small list of human-readable insight callouts.
 *
 * Design principles:
 *  - No i18n, no date formatting — returns raw numbers/strings for the
 *    component layer to format with locale-aware helpers.
 *  - Each rule is an isolated function; easy to unit-test independently.
 *  - Caps at MAX_CALLOUTS total so the UI never feels noisy.
 *  - All rules are additive: a missing platform simply produces no callout.
 */

import type {
  StageLinkInsightsDashboard,
  StageLinkInsightsHistoryPoint,
  StageLinkInsightsPlatform,
} from '@stagelink/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InsightCalloutKind =
  | 'fastest_growing'
  | 'top_content'
  | 'momentum_building'
  | 'growth_flattening'
  | 'newly_connected';

export interface InsightCallout {
  /** Stable unique id for React key prop. */
  id: string;
  kind: InsightCalloutKind;
  platform: StageLinkInsightsPlatform;
  /** i18n key for the platform display name, e.g. "Spotify". */
  platformLabel: string;
  /**
   * For growth / momentum callouts: the primary metric key used
   * (e.g. 'followers_total', 'subscriber_count').
   */
  metricKey?: string;
  /**
   * Absolute delta for the selected range (latest − oldest history point).
   * Positive means growth; negative means decline.
   */
  absoluteDelta?: number;
  /**
   * Percentage change for the selected range.
   * 12.3 means +12.3 %; -5 means −5 %.
   */
  pctChange?: number;
  /**
   * For top_content: human-readable title of the best-performing item.
   */
  contentTitle?: string;
  contentMetricLabel?: string;
  contentMetricValue?: string;
  contentUrl?: string | null;
  /**
   * For newly_connected: how many days ago the connection was created
   * (rounded down, min 0).
   */
  connectedDaysAgo?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Primary follower/subscriber metric key per platform. */
const PRIMARY_METRIC: Partial<Record<StageLinkInsightsPlatform, string>> = {
  spotify: 'followers_total',
  youtube: 'subscriber_count',
  soundcloud: 'followers_count',
};

const PLATFORM_LABELS: Record<StageLinkInsightsPlatform, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
};

/** Maximum number of callouts to surface at once. */
const MAX_CALLOUTS = 4;

/** Minimum absolute growth to emit a "fastest growing" callout. */
const MIN_GROWTH_ABS = 50;

/** Minimum % growth to emit a "fastest growing" callout. */
const MIN_GROWTH_PCT = 0.5;

/** A connection created within this many days is "newly connected". */
const NEWLY_CONNECTED_DAYS = 7;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function numericMetric(history: StageLinkInsightsHistoryPoint[], key: string): (number | null)[] {
  return history.map((h) => {
    const v = h.metrics[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  });
}

function latestValue(values: (number | null)[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function oldestValue(values: (number | null)[]): number | null {
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function daysSince(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Rule: fastest growing platform
// ---------------------------------------------------------------------------

function ruleFastestGrowing(data: StageLinkInsightsDashboard): InsightCallout | null {
  interface Candidate {
    platform: StageLinkInsightsPlatform;
    metricKey: string;
    absoluteDelta: number;
    pctChange: number;
  }

  const candidates: Candidate[] = [];

  for (const p of data.platforms) {
    if (p.connection?.status !== 'connected') continue;
    if (p.history.length < 2) continue;

    const metricKey = PRIMARY_METRIC[p.platform];
    if (!metricKey) continue;

    const values = numericMetric(p.history, metricKey);
    const latest = latestValue(values);
    const oldest = oldestValue(values);

    if (latest === null || oldest === null) continue;

    const delta = latest - oldest;
    const pct = oldest > 0 ? (delta / oldest) * 100 : 0;

    if (delta >= MIN_GROWTH_ABS || pct >= MIN_GROWTH_PCT) {
      candidates.push({
        platform: p.platform,
        metricKey,
        absoluteDelta: delta,
        pctChange: pct,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Pick the platform with the highest % change.
  const best = candidates.reduce((a, b) => (b.pctChange > a.pctChange ? b : a));

  return {
    id: `fastest_growing_${best.platform}`,
    kind: 'fastest_growing',
    platform: best.platform,
    platformLabel: PLATFORM_LABELS[best.platform],
    metricKey: best.metricKey,
    absoluteDelta: Math.round(best.absoluteDelta),
    pctChange: Math.round(best.pctChange * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Rule: top performing content
// ---------------------------------------------------------------------------

function ruleTopContent(data: StageLinkInsightsDashboard): InsightCallout | null {
  // Collect all top-content items across connected platforms.
  for (const p of data.platforms) {
    if (p.connection?.status !== 'connected') continue;
    if (!p.latestSnapshot) continue;
    const topContent = p.latestSnapshot.topContent;
    if (topContent.length === 0) continue;

    // topContent[0] is already the most-performed item (sorted by the API).
    const item = topContent[0];
    if (!item) continue;

    return {
      id: `top_content_${p.platform}_${item.externalId}`,
      kind: 'top_content',
      platform: p.platform,
      platformLabel: PLATFORM_LABELS[p.platform],
      contentTitle: item.title,
      contentMetricLabel: item.metricLabel,
      contentMetricValue: item.metricValue,
      contentUrl: item.externalUrl,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Rule: momentum (accelerating growth) or growth flattening
// ---------------------------------------------------------------------------

function ruleMomentum(data: StageLinkInsightsDashboard): InsightCallout | null {
  for (const p of data.platforms) {
    if (p.connection?.status !== 'connected') continue;
    if (p.history.length < 3) continue;

    const metricKey = PRIMARY_METRIC[p.platform];
    if (!metricKey) continue;

    const values = numericMetric(p.history, metricKey);
    const validValues = values.filter((v): v is number => v !== null);
    if (validValues.length < 3) continue;

    // Last three valid values — slice guarantees exactly 3 since we checked length < 3 above
    const lastThree = validValues.slice(-3);
    const a = lastThree[0] as number;
    const b = lastThree[1] as number;
    const c = lastThree[2] as number;
    const d1 = b - a; // older delta
    const d2 = c - b; // newer delta

    // Accelerating: both deltas positive and d2 > d1
    if (d1 > 0 && d2 > 0 && d2 > d1) {
      return {
        id: `momentum_building_${p.platform}`,
        kind: 'momentum_building',
        platform: p.platform,
        platformLabel: PLATFORM_LABELS[p.platform],
        metricKey,
        absoluteDelta: Math.round(d2),
        pctChange: b > 0 ? Math.round((d2 / b) * 100 * 10) / 10 : 0,
      };
    }

    // Flattening / declining: was growing, now slower or negative
    if (d1 > 0 && d2 <= 0) {
      return {
        id: `growth_flattening_${p.platform}`,
        kind: 'growth_flattening',
        platform: p.platform,
        platformLabel: PLATFORM_LABELS[p.platform],
        metricKey,
        absoluteDelta: Math.round(d2),
        pctChange: b > 0 ? Math.round((d2 / b) * 100 * 10) / 10 : 0,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Rule: newly connected platform
// ---------------------------------------------------------------------------

function ruleNewlyConnected(data: StageLinkInsightsDashboard): InsightCallout | null {
  for (const p of data.platforms) {
    if (p.connection?.status !== 'connected') continue;
    // Only surface if they have at least one data point (first sync done)
    if (!p.latestSnapshot) continue;

    const daysAgo = daysSince(p.connection.createdAt);
    if (daysAgo <= NEWLY_CONNECTED_DAYS) {
      return {
        id: `newly_connected_${p.platform}`,
        kind: 'newly_connected',
        platform: p.platform,
        platformLabel: PLATFORM_LABELS[p.platform],
        connectedDaysAgo: daysAgo,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Derives up to MAX_CALLOUTS insight callouts from the dashboard data.
 *
 * Returns an empty array when there are no connected platforms or not enough
 * history to generate meaningful insights.
 */
export function computeInsights(data: StageLinkInsightsDashboard): InsightCallout[] {
  if (!data.hasAnyConnectedPlatforms) return [];

  const results: InsightCallout[] = [];

  // Order matters — higher-value callouts first.
  const candidates = [
    ruleFastestGrowing(data),
    ruleTopContent(data),
    ruleMomentum(data),
    ruleNewlyConnected(data),
  ];

  for (const callout of candidates) {
    if (callout && results.length < MAX_CALLOUTS) {
      results.push(callout);
    }
  }

  return results;
}
