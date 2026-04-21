import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import type {
  SpotifyInsightsConnectionValidationResult,
  SpotifyInsightsSyncResult,
  StageLinkInsightsConnection,
  StageLinkInsightsDashboard,
} from '@stagelink/types';
import { CurrentUser, CheckOwnership } from '../../common/decorators';
import { OwnershipGuard } from '../../common/guards';
import { extractClientIp } from '../../common/utils/request.utils';
import { SpotifyInsightsConnectionDto } from './dto';
import { InsightsService } from './insights.service';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get(':artistId/dashboard')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  getDashboard(@Param('artistId') artistId: string): Promise<StageLinkInsightsDashboard> {
    return this.insightsService.getDashboard(artistId);
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
}
