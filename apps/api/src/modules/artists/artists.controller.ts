import { Controller, Get, Param } from '@nestjs/common';
import { ArtistsService } from './artists.service';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.artistsService.findByUsername(username);
  }
}
