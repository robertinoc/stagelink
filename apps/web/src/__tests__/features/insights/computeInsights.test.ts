import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { computeInsights } from '@/features/insights/computeInsights';
import type {
  StageLinkInsightsDashboard,
  StageLinkInsightsPlatformSummary,
  StageLinkInsightsHistoryPoint,
  StageLinkInsightsTopContentItem,
} from '@stagelink/types';

// ---------------------------------------------------------------------------
// Test builders
// ---------------------------------------------------------------------------

function makeHistory(
  values: number[],
  metricKey = 'followers_total',
): StageLinkInsightsHistoryPoint[] {
  return values.map((v, i) => ({
    capturedAt: new Date(2024, 0, i + 1).toISOString(),
    metrics: { [metricKey]: v },
  }));
}

function makePlatform(
  overrides: Partial<StageLinkInsightsPlatformSummary> = {},
): StageLinkInsightsPlatformSummary {
  return {
    platform: 'spotify',
    capabilities: {
      platform: 'spotify',
      connectionMethod: 'oauth',
      connectionFlowReady: true,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'full',
      topContent: 'full',
      historicalSnapshots: 'full',
      scheduledSync: 'full',
    },
    connection: {
      artistId: 'artist-1',
      platform: 'spotify',
      status: 'connected',
      connectionMethod: 'oauth',
      displayName: 'Test Artist',
      externalAccountId: null,
      externalHandle: null,
      externalUrl: null,
      scopes: [],
      hasAccessToken: true,
      hasRefreshToken: true,
      tokenExpiresAt: null,
      lastSyncStartedAt: null,
      lastSyncedAt: null,
      lastSyncStatus: 'success',
      lastSyncError: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    latestSnapshot: null,
    history: [],
    ...overrides,
  };
}

function makeDashboard(
  platforms: StageLinkInsightsPlatformSummary[],
  connected = true,
): StageLinkInsightsDashboard {
  return {
    artistId: 'artist-1',
    feature: 'stage_link_insights',
    selectedRange: '30d',
    hasAnyConnectedPlatforms: connected,
    lastUpdatedAt: new Date().toISOString(),
    summaryCards: [],
    platforms,
  };
}

function makeTopContent(
  overrides: Partial<StageLinkInsightsTopContentItem> = {},
): StageLinkInsightsTopContentItem {
  return {
    platform: 'spotify',
    externalId: 'track-1',
    title: 'My Top Track',
    subtitle: null,
    metricLabel: 'Streams',
    metricValue: '1,234',
    imageUrl: null,
    externalUrl: 'https://spotify.com/track/1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeInsights()', () => {
  // ── Guard: no connected platforms ────────────────────────────────────────

  describe('when there are no connected platforms', () => {
    it('returns an empty array immediately', () => {
      const dashboard = makeDashboard([], false);
      expect(computeInsights(dashboard)).toEqual([]);
    });

    it('returns empty even if platforms array has entries but hasAnyConnectedPlatforms=false', () => {
      const platform = makePlatform({ history: makeHistory([1000, 2000]) });
      const dashboard = makeDashboard([platform], false);
      expect(computeInsights(dashboard)).toEqual([]);
    });
  });

  // ── Rule: fastest_growing ────────────────────────────────────────────────

  describe('fastest_growing rule', () => {
    it('emits a fastest_growing callout when growth exceeds MIN_GROWTH_ABS (50)', () => {
      const platform = makePlatform({ history: makeHistory([1000, 2000]) }); // +1000 followers
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'fastest_growing');
      expect(callout).toBeDefined();
      expect(callout?.platform).toBe('spotify');
      expect(callout?.absoluteDelta).toBe(1000);
    });

    it('includes the correct pctChange (rounded to 1 decimal)', () => {
      const platform = makePlatform({ history: makeHistory([1000, 1100]) }); // +10%
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'fastest_growing');
      expect(callout?.pctChange).toBe(10);
    });

    it('does NOT emit fastest_growing when growth is below both thresholds', () => {
      // +10 absolute and 0.1% — both below minimums (50 abs / 0.5%)
      const platform = makePlatform({ history: makeHistory([10_000, 10_010]) });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'fastest_growing')).toBeUndefined();
    });

    it('picks the platform with the highest % change when multiple qualify', () => {
      const spotify = makePlatform({
        platform: 'spotify',
        history: makeHistory([1000, 1100], 'followers_total'), // +10%
      });
      const youtube = makePlatform({
        platform: 'youtube',
        history: makeHistory([100, 200], 'subscriber_count'), // +100%
        connection: {
          ...makePlatform().connection!,
          platform: 'youtube',
        },
      });
      const result = computeInsights(makeDashboard([spotify, youtube]));
      const callout = result.find((c) => c.kind === 'fastest_growing');
      expect(callout?.platform).toBe('youtube');
    });

    it('does NOT emit fastest_growing when platform is disconnected', () => {
      const platform = makePlatform({
        history: makeHistory([1000, 5000]),
        connection: { ...makePlatform().connection!, status: 'disconnected' },
      });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'fastest_growing')).toBeUndefined();
    });

    it('does NOT emit fastest_growing with only 1 history point', () => {
      const platform = makePlatform({ history: makeHistory([5000]) });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'fastest_growing')).toBeUndefined();
    });

    it('uses followers_count metric key for SoundCloud', () => {
      const platform = makePlatform({
        platform: 'soundcloud',
        history: makeHistory([500, 1000], 'followers_count'),
        connection: { ...makePlatform().connection!, platform: 'soundcloud' },
      });
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'fastest_growing');
      expect(callout?.platform).toBe('soundcloud');
      expect(callout?.metricKey).toBe('followers_count');
    });
  });

  // ── Rule: top_content ────────────────────────────────────────────────────

  describe('top_content rule', () => {
    it('emits a top_content callout when a connected platform has topContent', () => {
      const topContent = [makeTopContent()];
      const platform = makePlatform({
        latestSnapshot: {
          id: 'snap-1',
          platformConnectionId: 'conn-1',
          capturedAt: new Date().toISOString(),
          metrics: {},
          topContent,
        },
      });
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'top_content');
      expect(callout).toBeDefined();
      expect(callout?.contentTitle).toBe('My Top Track');
      expect(callout?.contentMetricLabel).toBe('Streams');
      expect(callout?.contentUrl).toBe('https://spotify.com/track/1');
    });

    it('does NOT emit top_content when topContent array is empty', () => {
      const platform = makePlatform({
        latestSnapshot: {
          id: 'snap-1',
          platformConnectionId: 'conn-1',
          capturedAt: new Date().toISOString(),
          metrics: {},
          topContent: [],
        },
      });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'top_content')).toBeUndefined();
    });

    it('does NOT emit top_content when latestSnapshot is null', () => {
      const platform = makePlatform({ latestSnapshot: null });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'top_content')).toBeUndefined();
    });
  });

  // ── Rule: momentum_building ──────────────────────────────────────────────

  describe('momentum_building rule', () => {
    it('emits momentum_building when growth is accelerating (d2 > d1, both positive)', () => {
      // d1 = 100-50 = 50, d2 = 200-100 = 100 → accelerating
      const platform = makePlatform({ history: makeHistory([50, 100, 200]) });
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'momentum_building');
      expect(callout).toBeDefined();
      expect(callout?.platform).toBe('spotify');
    });

    it('emits growth_flattening when growth was positive then turns negative', () => {
      // d1 = 100 (growing), d2 = -50 (declining)
      const platform = makePlatform({ history: makeHistory([1000, 1100, 1050]) });
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'growth_flattening');
      expect(callout).toBeDefined();
      expect(callout?.absoluteDelta).toBe(-50);
    });

    it('emits growth_flattening when growth was positive then stagnates (d2=0)', () => {
      const platform = makePlatform({ history: makeHistory([1000, 1100, 1100]) });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'growth_flattening')).toBeDefined();
    });

    it('does NOT emit momentum when d1 <= 0 (no prior growth)', () => {
      // d1 = -100 (declining), d2 = +50
      const platform = makePlatform({ history: makeHistory([1000, 900, 950]) });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'momentum_building')).toBeUndefined();
      expect(result.find((c) => c.kind === 'growth_flattening')).toBeUndefined();
    });

    it('requires at least 3 history points', () => {
      const platform = makePlatform({ history: makeHistory([100, 200]) });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'momentum_building')).toBeUndefined();
    });
  });

  // ── Rule: newly_connected ────────────────────────────────────────────────

  describe('newly_connected rule', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('emits newly_connected when platform was connected within the last 7 days', () => {
      const platform = makePlatform({
        connection: {
          ...makePlatform().connection!,
          createdAt: new Date('2024-01-30T12:00:00Z').toISOString(), // 2 days ago
        },
        latestSnapshot: {
          id: 'snap-1',
          platformConnectionId: 'conn-1',
          capturedAt: new Date().toISOString(),
          metrics: {},
          topContent: [],
        },
      });
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'newly_connected');
      expect(callout).toBeDefined();
      expect(callout?.connectedDaysAgo).toBe(2);
    });

    it('does NOT emit newly_connected when connection is older than 7 days', () => {
      const platform = makePlatform({
        connection: {
          ...makePlatform().connection!,
          createdAt: new Date('2024-01-10T12:00:00Z').toISOString(), // 22 days ago
        },
        latestSnapshot: {
          id: 'snap-1',
          platformConnectionId: 'conn-1',
          capturedAt: new Date().toISOString(),
          metrics: {},
          topContent: [],
        },
      });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'newly_connected')).toBeUndefined();
    });

    it('does NOT emit newly_connected when latestSnapshot is null (no data yet)', () => {
      const platform = makePlatform({
        connection: {
          ...makePlatform().connection!,
          createdAt: new Date('2024-01-30T12:00:00Z').toISOString(),
        },
        latestSnapshot: null,
      });
      const result = computeInsights(makeDashboard([platform]));
      expect(result.find((c) => c.kind === 'newly_connected')).toBeUndefined();
    });
  });

  // ── MAX_CALLOUTS cap ─────────────────────────────────────────────────────

  describe('MAX_CALLOUTS cap (4)', () => {
    it('never returns more than 4 callouts', () => {
      // Build a dashboard that could produce all 4 rule outputs simultaneously
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-01T12:00:00Z'));

      const platform = makePlatform({
        history: makeHistory([50, 100, 200]), // fastest_growing + momentum_building
        connection: {
          ...makePlatform().connection!,
          createdAt: new Date('2024-01-30T12:00:00Z').toISOString(), // newly_connected
        },
        latestSnapshot: {
          id: 'snap-1',
          platformConnectionId: 'conn-1',
          capturedAt: new Date().toISOString(),
          metrics: {},
          topContent: [makeTopContent()], // top_content
        },
      });

      const result = computeInsights(makeDashboard([platform]));
      expect(result.length).toBeLessThanOrEqual(4);

      vi.useRealTimers();
    });
  });

  // ── Callout IDs are stable and unique ────────────────────────────────────

  describe('callout IDs', () => {
    it('generates stable IDs using platform name', () => {
      const platform = makePlatform({ history: makeHistory([1000, 2000]) });
      const result = computeInsights(makeDashboard([platform]));
      const callout = result.find((c) => c.kind === 'fastest_growing');
      expect(callout?.id).toBe('fastest_growing_spotify');
    });

    it('all returned callouts have unique IDs', () => {
      const platform = makePlatform({ history: makeHistory([50, 100, 200]) });
      const result = computeInsights(makeDashboard([platform]));
      const ids = result.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
