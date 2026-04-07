import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';
import { EpkService } from './epk.service';
import { UpdateEpkDto } from './dto';

@Controller('artists/:artistId/epk')
export class EpkController {
  constructor(private readonly epkService: EpkService) {}

  @Get()
  getEditorData(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    return this.epkService.getEditorData(artistId, user.id);
  }

  @Patch()
  update(
    @Param('artistId') artistId: string,
    @Body() dto: UpdateEpkDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    return this.epkService.update(artistId, dto, user.id, extractClientIp(req));
  }

  @Post('publish')
  publish(@Param('artistId') artistId: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.epkService.publish(artistId, user.id, extractClientIp(req));
  }

  @Post('unpublish')
  unpublish(@Param('artistId') artistId: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.epkService.unpublish(artistId, user.id, extractClientIp(req));
  }
}
