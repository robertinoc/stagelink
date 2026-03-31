import { Controller, Get, Param, ParseUUIDPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SubscribersService } from './subscribers.service';
import { CheckOwnership } from '../../common/decorators';
import { OwnershipGuard } from '../../common/guards';

/**
 * SubscribersController — private read/export endpoints for fan subscribers.
 *
 * Routes (with global /api prefix):
 *   GET /api/artists/:artistId/subscribers           — paginated list
 *   GET /api/artists/:artistId/subscribers/export    — CSV download
 *
 * Both routes require authentication (global JwtAuthGuard) and verify
 * that the authenticated user is a member of the artist (OwnershipGuard).
 */
@Controller('artists')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  /**
   * GET /api/artists/:artistId/subscribers
   *
   * Returns paginated subscriber list for the artist.
   *
   * Query params:
   *   page  — 1-based page number (default: 1)
   *   limit — page size, max 100 (default: 50)
   */
  @Get(':artistId/subscribers')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  async list(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscribersService.list(
      artistId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * GET /api/artists/:artistId/subscribers/export
   *
   * Downloads a CSV of all subscribers for the artist.
   * Content-Disposition: attachment; filename="subscribers-{artistId}.csv"
   *
   * Exported columns: email, status, consent_given, created_at, source_block_id
   */
  @Get(':artistId/subscribers/export')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  async exportCsv(
    @Param('artistId', ParseUUIDPipe) artistId: string,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.subscribersService.exportCsv(artistId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${artistId}.csv"`);
    res.send(csv);
  }
}
