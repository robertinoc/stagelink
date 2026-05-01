import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { SubscribersService } from './subscribers.service';
import { AuditService } from '../audit/audit.service';
import { CheckOwnership, CurrentUser } from '../../common/decorators';
import { OwnershipGuard } from '../../common/guards';
import { extractClientIp } from '../../common/utils/request.utils';
import { ParseCuidPipe } from '../../common/pipes/parse-cuid.pipe';

/**
 * SubscribersController — private read/export endpoints for fan subscribers.
 *
 * Routes (with global /api prefix):
 *   GET /api/artists/:artistId/subscribers           — paginated list
 *   GET /api/artists/:artistId/subscribers/export    — CSV download
 *
 * Both routes require authentication (global JwtAuthGuard) and verify
 * that the authenticated user is a member of the artist (OwnershipGuard).
 * Both routes emit a fire-and-forget audit log entry (GDPR data access trail).
 */
@Controller('artists')
export class SubscribersController {
  constructor(
    private readonly subscribersService: SubscribersService,
    private readonly auditService: AuditService,
  ) {}

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
    @Param('artistId', ParseCuidPipe) artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 50;

    const result = await this.subscribersService.list(artistId, parsedPage, parsedLimit);

    this.auditService.log({
      actorId: user.id,
      action: 'subscribers.list',
      entityType: 'artist',
      entityId: artistId,
      metadata: { page: parsedPage, limit: parsedLimit, total: result.total },
      ipAddress: extractClientIp(req) ?? undefined,
    });

    return result;
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
    @Param('artistId', ParseCuidPipe) artistId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.subscribersService.exportCsv(artistId);

    this.auditService.log({
      actorId: user.id,
      action: 'subscribers.export_csv',
      entityType: 'artist',
      entityId: artistId,
      ipAddress: extractClientIp(req) ?? undefined,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${artistId}.csv"`);
    res.send(csv);
  }
}
