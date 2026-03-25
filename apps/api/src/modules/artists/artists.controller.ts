import { Controller, Get, Param } from '@nestjs/common';
import { ArtistsService } from './artists.service';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  /**
   * GET /api/artists
   * List artists (future: paginated, auth-scoped).
   */
  @Get()
  findAll() {
    return this.artistsService.findAll();
  }

  /**
   * GET /api/artists/:username
   * Resolve artist by username — core multi-tenant lookup.
   * TODO: Query DB by username, return artist + page data.
   */
  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.artistsService.findByUsername(username);
  }
}
