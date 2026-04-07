import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CheckOwnership } from '../../common/decorators';
import { OwnershipGuard } from '../../common/guards';
import type {
  AnalyticsFanInsightsDto,
  AnalyticsOverviewDto,
  AnalyticsProTrendsDto,
  AnalyticsSmartLinkPerformanceDto,
} from './dto/analytics-response.dto';

/**
 * AnalyticsController — private analytics endpoints for dashboard use.
 *
 * All routes require a valid session (global JwtAuthGuard) and at least
 * 'read' membership on the target artist (OwnershipGuard).
 *
 * Routes:
 *   GET /api/analytics/:artistId/overview?range=7d|30d|90d
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/:artistId/overview
   *
   * Returns aggregated analytics for the artist: page views, link clicks,
   * CTR, smart link resolutions, and top 10 links by click count.
   *
   * @param artistId  Artist UUID from the route param.
   * @param range     Date range preset: '7d' | '30d' | '90d'. Defaults to '30d'.
   *
   * Authorization: requires 'read' access on the artist (any role: viewer and up).
   * Returns 404 if the artist does not exist or the caller is not a member.
   */
  @Get(':artistId/overview')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getOverview(
    @Param('artistId') artistId: string,
    @Query('range') range?: string,
  ): Promise<AnalyticsOverviewDto> {
    return this.analyticsService.getOverview(artistId, range);
  }

  @Get(':artistId/pro/trends')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getProTrends(
    @Param('artistId') artistId: string,
    @Query('range') range?: string,
  ): Promise<AnalyticsProTrendsDto> {
    return this.analyticsService.getProTrends(artistId, range);
  }

  @Get(':artistId/pro/smart-links')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getSmartLinkPerformance(
    @Param('artistId') artistId: string,
    @Query('range') range?: string,
  ): Promise<AnalyticsSmartLinkPerformanceDto> {
    return this.analyticsService.getSmartLinkPerformance(artistId, range);
  }

  @Get(':artistId/pro/fan-insights')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getFanInsights(
    @Param('artistId') artistId: string,
    @Query('range') range?: string,
  ): Promise<AnalyticsFanInsightsDto> {
    return this.analyticsService.getFanInsights(artistId, range);
  }
}
