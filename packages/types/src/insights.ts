export const STAGELINK_INSIGHTS_PLATFORMS = ['spotify', 'youtube', 'soundcloud'] as const;
export type StageLinkInsightsPlatform = (typeof STAGELINK_INSIGHTS_PLATFORMS)[number];

export const STAGELINK_INSIGHTS_CONNECTION_METHODS = ['oauth', 'reference'] as const;
export type StageLinkInsightsConnectionMethod =
  (typeof STAGELINK_INSIGHTS_CONNECTION_METHODS)[number];

export const STAGELINK_INSIGHTS_CONNECTION_STATUSES = [
  'disconnected',
  'pending',
  'connected',
  'needs_reauth',
  'error',
] as const;
export type StageLinkInsightsConnectionStatus =
  (typeof STAGELINK_INSIGHTS_CONNECTION_STATUSES)[number];

export const STAGELINK_INSIGHTS_SYNC_STATUSES = [
  'never',
  'pending',
  'success',
  'partial',
  'error',
] as const;
export type StageLinkInsightsSyncStatus = (typeof STAGELINK_INSIGHTS_SYNC_STATUSES)[number];

export const STAGELINK_INSIGHTS_SUPPORT_LEVELS = ['full', 'partial', 'none'] as const;
export type StageLinkInsightsSupportLevel = (typeof STAGELINK_INSIGHTS_SUPPORT_LEVELS)[number];

export interface StageLinkInsightsPlatformCapabilities {
  platform: StageLinkInsightsPlatform;
  connectionMethod: StageLinkInsightsConnectionMethod;
  connectionFlowReady: boolean;
  requiresArtistOwnedAccount: boolean;
  profileBasics: StageLinkInsightsSupportLevel;
  audienceMetrics: StageLinkInsightsSupportLevel;
  topContent: StageLinkInsightsSupportLevel;
  historicalSnapshots: StageLinkInsightsSupportLevel;
  scheduledSync: StageLinkInsightsSupportLevel;
}

export interface StageLinkInsightsConnection {
  artistId: string;
  platform: StageLinkInsightsPlatform;
  status: StageLinkInsightsConnectionStatus;
  connectionMethod: StageLinkInsightsConnectionMethod;
  displayName: string | null;
  externalAccountId: string | null;
  externalHandle: string | null;
  externalUrl: string | null;
  scopes: string[];
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiresAt: string | null;
  lastSyncStartedAt: string | null;
  lastSyncedAt: string | null;
  lastSyncStatus: StageLinkInsightsSyncStatus;
  lastSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageLinkInsightsTopContentItem {
  platform: StageLinkInsightsPlatform;
  externalId: string;
  title: string;
  subtitle: string | null;
  metricLabel: string;
  metricValue: string;
  imageUrl: string | null;
  externalUrl: string | null;
}

export interface StageLinkInsightsSnapshot {
  platform: StageLinkInsightsPlatform;
  capturedAt: string;
  profile: {
    displayName: string | null;
    imageUrl: string | null;
    externalUrl: string | null;
  };
  metrics: Record<string, string | number | boolean | null>;
  topContent: StageLinkInsightsTopContentItem[];
}

export interface StageLinkInsightsSummaryCard {
  id: 'connected_platforms' | 'synced_platforms' | 'stored_snapshots' | 'supported_platforms';
  value: string;
}

export interface StageLinkInsightsPlatformSummary {
  platform: StageLinkInsightsPlatform;
  capabilities: StageLinkInsightsPlatformCapabilities;
  connection: StageLinkInsightsConnection | null;
  latestSnapshot: StageLinkInsightsSnapshot | null;
}

export interface StageLinkInsightsDashboard {
  artistId: string;
  feature: 'stage_link_insights';
  hasAnyConnectedPlatforms: boolean;
  lastUpdatedAt: string | null;
  summaryCards: StageLinkInsightsSummaryCard[];
  platforms: StageLinkInsightsPlatformSummary[];
}
