import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { ArtistsService, CreateArtistDto, UpdateArtistDto } from './artists.service';
import { OwnershipGuard } from '../../common/guards';
import { CheckOwnership, CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  /** GET /api/artists — list all artists the caller is a member of */
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.artistsService.findAllForUser(user.id);
  }

  /** GET /api/artists/:id */
  @Get(':id')
  @CheckOwnership('artist', 'id', 'read')
  @UseGuards(OwnershipGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.artistsService.findOne(id, user.id);
  }

  /** POST /api/artists */
  @Post()
  create(@Body() dto: CreateArtistDto, @CurrentUser() user: User, @Req() req: Request) {
    const ip = extractClientIp(req);
    return this.artistsService.create(dto, user.id, ip);
  }

  /** PATCH /api/artists/:id */
  @Patch(':id')
  @CheckOwnership('artist', 'id', 'write')
  @UseGuards(OwnershipGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArtistDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = extractClientIp(req);
    return this.artistsService.update(id, dto, user.id, ip);
  }

  /** DELETE /api/artists/:id */
  @Delete(':id')
  @CheckOwnership('artist', 'id', 'owner')
  @UseGuards(OwnershipGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    const ip = extractClientIp(req);
    return this.artistsService.remove(id, user.id, ip);
  }
}
