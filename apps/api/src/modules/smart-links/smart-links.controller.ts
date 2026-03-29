import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SmartLinksService } from './smart-links.service';
import { CreateSmartLinkDto, UpdateSmartLinkDto } from './dto';

/**
 * SmartLinksController — CRUD for artist smart links (authenticated).
 *
 * Routes (with global /api prefix):
 *   GET    /api/artists/:artistId/smart-links
 *   POST   /api/artists/:artistId/smart-links
 *   PATCH  /api/smart-links/:id
 *   DELETE /api/smart-links/:id
 *
 * All routes require JWT auth (global JwtAuthGuard).
 * Membership is validated in SmartLinksService.
 */

/**
 * Extract the original client IP from a potentially comma-separated
 * X-Forwarded-For header (format: client, proxy1, proxy2).
 *
 * Takes the first (leftmost) entry — the original client — rather than the
 * raw header string, which may include multiple comma-separated values.
 * Ensure your reverse proxy strips untrusted client-supplied XFF values so
 * the leftmost entry is always the real client (not attacker-controlled).
 */
function extractClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (!forwarded) return undefined;
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw ?? '').split(',')[0]?.trim() || undefined;
}

@Controller()
export class SmartLinksController {
  constructor(private readonly smartLinksService: SmartLinksService) {}

  /** GET /api/artists/:artistId/smart-links */
  @Get('artists/:artistId/smart-links')
  findByArtist(@Param('artistId') artistId: string, @Req() req: Request) {
    const userId = (req as Request & { user: { sub: string } }).user.sub;
    return this.smartLinksService.findByArtist(artistId, userId);
  }

  /** POST /api/artists/:artistId/smart-links */
  @Post('artists/:artistId/smart-links')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('artistId') artistId: string,
    @Body() dto: CreateSmartLinkDto,
    @Req() req: Request,
  ) {
    const userId = (req as Request & { user: { sub: string } }).user.sub;
    return this.smartLinksService.create(artistId, dto, userId, extractClientIp(req));
  }

  /** PATCH /api/smart-links/:id */
  @Patch('smart-links/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSmartLinkDto, @Req() req: Request) {
    const userId = (req as Request & { user: { sub: string } }).user.sub;
    return this.smartLinksService.update(id, dto, userId, extractClientIp(req));
  }

  /** DELETE /api/smart-links/:id */
  @Delete('smart-links/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user: { sub: string } }).user.sub;
    await this.smartLinksService.remove(id, userId, extractClientIp(req));
  }
}
