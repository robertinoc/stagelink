import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import type {
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
import { SpotifyInsightsConnectionDto, YouTubeInsightsConnectionDto } from './dto';
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

  @Post(':artistId/spotify/validate')
  validateSpotifyConnection(
    @Param('artistId') artistId: string,
    @Body() dto: SpotifyInsightsConnectionDto,
    @CurrentUser() user: User,
  ): Promise<SpotifyInsightsConnectionValidationResult> {
    return this.insightsService.validateSpotifyConnection(artistId, dto, user.id);
  }

  @Patch(':artistId/spotify')
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
  syncSpotifyConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<SpotifyInsightsSyncResult> {
    return this.insightsService.syncSpotifyConnection(artistId, user.id, extractClientIp(req));
  }

  @Post(':artistId/youtube/validate')
  validateYouTubeConnection(
    @Param('artistId') artistId: string,
    @Body() dto: YouTubeInsightsConnectionDto,
    @CurrentUser() user: User,
  ): Promise<YouTubeInsightsConnectionValidationResult> {
    return this.insightsService.validateYouTubeConnection(artistId, dto, user.id);
  }

  @Patch(':artistId/youtube')
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
  syncYouTubeConnection(
    @Param('artistId') artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<YouTubeInsightsSyncResult> {
    return this.insightsService.syncYouTubeConnection(artistId, user.id, extractClientIp(req));
  }
}
