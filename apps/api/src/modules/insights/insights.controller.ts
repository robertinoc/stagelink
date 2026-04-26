import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import type {
  InsightsSyncHealth,
  SoundCloudInsightsConnectionValidationResult,
  SoundCloudInsightsSyncResult,
  SpotifyInsightsConnectionValidationResult,
  SpotifyInsightsSyncResult,
  StageLinkInsightsConnection,
  StageLinkInsightsDashboard,
  YouTubeInsightsConnectionValidationResult,
  YouTubeInsightsSyncResult,
} from '@stagelink/types';
import { CurrentUser, CheckOwnership } from '../../common/decorators';
import { OwnershipGuard } from '../../common/guards';
import { extractClientIp } from '../../common/utils/request.utils';
import {
  SoundCloudInsightsConnectionDto,
  SpotifyInsightsConnectionDto,
  YouTubeInsightsConnectionDto,
} from './dto';
import { InsightsService } from './insights.service';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get(':artistId/dashboard')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getDashboard(
    @Param('artistId') artistId: string,
    @Query('range') range?: string,
  ): Promise<StageLinkInsightsDashboard> {
    return this.insightsService.getDashboard(artistId, range);
  }

  /**
   * GET /:artistId/sync-health
   *
   * Returns a lightweight sync-health summary for all connected platform
   * connections owned by the artist. Useful for debugging stale data,
   * checking which connections have errors, and monitoring sync freshness
   * without triggering an actual sync.
   */
  @Get(':artistId/sync-health')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getSyncHealth(@Param('artistId') artistId: string): Promise<InsightsSyncHealth> {
    return this.insightsService.getSyncHealth(artistId);
  }

  @Post(':artistId/spotify/validate')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  validateSpotifyConnection(
    @Param('artistId') artistId: string,
    @Body() dto: SpotifyInsightsConnectionDto,
    @CurrentUser() user: User,
  ): Promise<SpotifyInsightsConnectionValidationResult> {
    return this.insightsService.validateSpotifyConnection(artistId, dto, user.id);
  }

  @Patch(':artistId/spotify')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  updateSpotifyConnection(
    @Param('artistId') artistId: string,
    @Body() dto: SpotifyInsightsConnectionDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<StageLinkInsightsConnection> {
    return this.insightsService.updateSpotifyConnection(
      artistId,
      dto,
      user.id,
      extractClientIp(req),
    );
  }

  @Post(':artistId/spotify/sync')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  syncSpotifyConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<SpotifyInsightsSyncResult> {
    return this.insightsService.syncSpotifyConnection(artistId, user.id, extractClientIp(req));
  }

  @Post(':artistId/youtube/validate')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  validateYouTubeConnection(
    @Param('artistId') artistId: string,
    @Body() dto: YouTubeInsightsConnectionDto,
    @CurrentUser() user: User,
  ): Promise<YouTubeInsightsConnectionValidationResult> {
    return this.insightsService.validateYouTubeConnection(artistId, dto, user.id);
  }

  @Patch(':artistId/youtube')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  updateYouTubeConnection(
    @Param('artistId') artistId: string,
    @Body() dto: YouTubeInsightsConnectionDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<StageLinkInsightsConnection> {
    return this.insightsService.updateYouTubeConnection(
      artistId,
      dto,
      user.id,
      extractClientIp(req),
    );
  }

  @Post(':artistId/youtube/sync')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  syncYouTubeConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<YouTubeInsightsSyncResult> {
    return this.insightsService.syncYouTubeConnection(artistId, user.id, extractClientIp(req));
  }

  @Post(':artistId/soundcloud/validate')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  validateSoundCloudConnection(
    @Param('artistId') artistId: string,
    @Body() dto: SoundCloudInsightsConnectionDto,
    @CurrentUser() user: User,
  ): Promise<SoundCloudInsightsConnectionValidationResult> {
    return this.insightsService.validateSoundCloudConnection(artistId, dto, user.id);
  }

  @Patch(':artistId/soundcloud')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  updateSoundCloudConnection(
    @Param('artistId') artistId: string,
    @Body() dto: SoundCloudInsightsConnectionDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<StageLinkInsightsConnection> {
    return this.insightsService.updateSoundCloudConnection(
      artistId,
      dto,
      user.id,
      extractClientIp(req),
    );
  }

  @Post(':artistId/soundcloud/sync')
  @CheckOwnership('artist', 'artistId', 'write')
  @UseGuards(OwnershipGuard)
  syncSoundCloudConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<SoundCloudInsightsSyncResult> {
    return this.insightsService.syncSoundCloudConnection(artistId, user.id, extractClientIp(req));
  }
}
