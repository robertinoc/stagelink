import { Controller, Get, Param, Query } from '@nestjs/common';
import { DEFAULT_LOCALE, isSupportedLocale } from '@stagelink/types';
import { Public } from '../../common/decorators';
import type { PublicEpkResponseDto } from './dto/public-epk-response.dto';
import { PublicEpkService } from './public-epk.service';

@Public()
@Controller('public/epk')
export class PublicEpkController {
  constructor(private readonly publicEpkService: PublicEpkService) {}

  @Get('by-username/:username')
  getByUsername(
    @Param('username') username: string,
    @Query('locale') localeQuery?: string,
  ): Promise<PublicEpkResponseDto> {
    return this.publicEpkService.getPublishedByUsername(
      username,
      isSupportedLocale(localeQuery) ? localeQuery : DEFAULT_LOCALE,
    );
  }
}
