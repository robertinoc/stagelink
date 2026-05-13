import { Body, Controller, Delete, Get, Header, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators';
import { extractClientIp } from '../../common/utils/request.utils';
import { DeleteAccountDto, UpdatePersonalDataDto } from './dto';
import { PrivacyRateLimitGuard } from './privacy-rate-limit.guard';
import { PrivacyService } from './privacy.service';

@Controller('privacy')
@UseGuards(PrivacyRateLimitGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('export')
  @Header('Content-Type', 'application/json; charset=utf-8')
  async exportUserData(@CurrentUser() user: User, @Req() req: Request) {
    return this.privacyService.exportUserData(user, extractClientIp(req));
  }

  @Patch('me')
  async updatePersonalData(
    @CurrentUser() user: User,
    @Body() dto: UpdatePersonalDataDto,
    @Req() req: Request,
  ) {
    return this.privacyService.updatePersonalData(user, dto, extractClientIp(req));
  }

  @Delete('account')
  async deleteAccount(
    @CurrentUser() user: User,
    @Body() dto: DeleteAccountDto,
    @Req() req: Request,
  ) {
    return this.privacyService.deleteAccount(user, dto, extractClientIp(req));
  }
}
