import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators';
import type { PublicEpkResponseDto } from './dto/public-epk-response.dto';
import { PublicEpkService } from './public-epk.service';

@Public()
@Controller('public/epk')
export class PublicEpkController {
  constructor(private readonly publicEpkService: PublicEpkService) {}

  @Get('by-username/:username')
  getByUsername(@Param('username') username: string): Promise<PublicEpkResponseDto> {
    return this.publicEpkService.getPublishedByUsername(username);
  }
}
