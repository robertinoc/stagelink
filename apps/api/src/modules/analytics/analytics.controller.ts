import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/:username
   * Returns analytics summary for an artist page.
   * TODO: Aggregate from analytics_events, apply plan-based scoping.
   */
  @Get(':username')
  getSummary(@Param('username') username: string) {
    return this.analyticsService.getSummary(username);
  }
}
