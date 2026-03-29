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
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.smartLinksService.create(artistId, dto, userId, ip);
  }

  /** PATCH /api/smart-links/:id */
  @Patch('smart-links/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSmartLinkDto, @Req() req: Request) {
    const userId = (req as Request & { user: { sub: string } }).user.sub;
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.smartLinksService.update(id, dto, userId, ip);
  }

  /** DELETE /api/smart-links/:id */
  @Delete('smart-links/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as Request & { user: { sub: string } }).user.sub;
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    await this.smartLinksService.remove(id, userId, ip);
  }
}
