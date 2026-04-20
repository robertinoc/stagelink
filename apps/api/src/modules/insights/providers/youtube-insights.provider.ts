import { Injectable } from '@nestjs/common';
import type {
  StageLinkInsightsPlatformCapabilities,
  StageLinkInsightsSnapshot,
} from '@stagelink/types';
import type {
  PlatformInsightsConnectionContext,
  PlatformInsightsProvider,
} from './insights-provider.interface';

@Injectable()
export class YouTubeInsightsProvider implements PlatformInsightsProvider {
  readonly platform = 'youtube' as const;
  readonly connectionMethod = 'oauth' as const;

  getCapabilities(): StageLinkInsightsPlatformCapabilities {
    return {
      platform: this.platform,
      connectionMethod: this.connectionMethod,
      connectionFlowReady: false,
      requiresArtistOwnedAccount: true,
      profileBasics: 'full',
      audienceMetrics: 'full',
      topContent: 'full',
      historicalSnapshots: 'full',
      scheduledSync: 'full',
    };
  }

  async syncLatestSnapshot(
    _context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot> {
    throw new Error('YouTube Insights sync is not implemented in the foundation layer');
  }
}
