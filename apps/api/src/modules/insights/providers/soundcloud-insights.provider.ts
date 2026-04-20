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
export class SoundCloudInsightsProvider implements PlatformInsightsProvider {
  readonly platform = 'soundcloud' as const;
  readonly connectionMethod = 'reference' as const;

  getCapabilities(): StageLinkInsightsPlatformCapabilities {
    return {
      platform: this.platform,
      connectionMethod: this.connectionMethod,
      connectionFlowReady: false,
      requiresArtistOwnedAccount: false,
      profileBasics: 'full',
      audienceMetrics: 'partial',
      topContent: 'partial',
      historicalSnapshots: 'partial',
      scheduledSync: 'partial',
    };
  }

  async syncLatestSnapshot(
    _context: PlatformInsightsConnectionContext,
  ): Promise<StageLinkInsightsSnapshot> {
    throw new Error('SoundCloud Insights sync is not implemented in the foundation layer');
  }
}
