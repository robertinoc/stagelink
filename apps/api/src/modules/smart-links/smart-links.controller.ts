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
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { SmartLinksService } from './smart-links.service';
import { CreateSmartLinkDto, UpdateSmartLinkDto } from './dto';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';

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
  findByArtist(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    return this.smartLinksService.findByArtist(artistId, user.id);
  }

  /** POST /api/artists/:artistId/smart-links */
  @Post('artists/:artistId/smart-links')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('artistId') artistId: string,
    @Body() dto: CreateSmartLinkDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.smartLinksService.create(artistId, dto, user.id, extractClientIp(req));
  }

  /** PATCH /api/smart-links/:id */
  @Patch('smart-links/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSmartLinkDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.smartLinksService.update(id, dto, user.id, extractClientIp(req));
  }

  /** DELETE /api/smart-links/:id */
  @Delete('smart-links/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    await this.smartLinksService.remove(id, user.id, extractClientIp(req));
  }
}
