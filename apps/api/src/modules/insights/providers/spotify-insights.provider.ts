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
export class SpotifyInsightsProvider implements PlatformInsightsProvider {
  readonly platform = 'spotify' as const;
  readonly connectionMethod = 'reference' as const;

  getCapabilities(): StageLinkInsightsPlatformCapabilities {
    return {
      platform: this.platform,
      connectionMethod: this.connectionMethod,
      connectionFlowReady: false,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'full',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    };
  }

  async syncLatestSnapshot(
    _context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot> {
    throw new Error('Spotify Insights sync is not implemented in the foundation layer');
  }
}
