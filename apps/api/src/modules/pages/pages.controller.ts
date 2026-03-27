import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { PagesService, UpdatePageDto } from './pages.service';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership, CurrentUser } from '../../common/decorators';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  /** GET /api/pages/artist/:artistId */
  @Get('artist/:artistId')
  @CheckOwnership('artist', 'artistId', 'read')
  @UseGuards(OwnershipGuard)
  findByArtist(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    return this.pagesService.findByArtist(artistId, user.id);
  }

  /** PATCH /api/pages/:pageId */
  @Patch(':pageId')
  @CheckOwnership('page', 'pageId', 'write')
  @UseGuards(OwnershipGuard)
  update(
    @Param('pageId') pageId: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = req.headers['x-forwarded-for'] as string | undefined;
    return this.pagesService.update(pageId, dto, user.id, ip);
  }
}
