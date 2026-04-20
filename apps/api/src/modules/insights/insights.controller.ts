import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { StageLinkInsightsDashboard } from '@stagelink/types';
import { CheckOwnership } from '../../common/decorators';
import { OwnershipGuard } from '../../common/guards';
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
}
