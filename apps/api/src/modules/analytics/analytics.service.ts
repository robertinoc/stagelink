import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  /**
   * TODO: Query analytics_events, aggregate page_views + link_clicks.
   * Scope by plan: Free = 30 days, Pro+ = full history + breakdown.
   */
  getSummary(username: string) {
    return {
      data: {
        pageViews: 0,
        linkClicks: 0,
        subscribers: 0,
        period: '30d',
      },
      username,
      message: 'Analytics stub — DB integration pending',
    };
  }
}
