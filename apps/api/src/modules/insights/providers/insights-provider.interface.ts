import type {
  StageLinkInsightsConnectionMethod,
  StageLinkInsightsPlatform,
  StageLinkInsightsPlatformCapabilities,
  StageLinkInsightsSnapshot,
} from '@stagelink/types';

export interface PlatformInsightsConnectionContext {
  externalAccountId?: string | null;
  externalHandle?: string | null;
  externalUrl?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface PlatformInsightsProvider {
  readonly platform: StageLinkInsightsPlatform;
  readonly connectionMethod: StageLinkInsightsConnectionMethod;
  getCapabilities(): StageLinkInsightsPlatformCapabilities;
  syncLatestSnapshot(
    context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot>;
}
