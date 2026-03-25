import { Controller, Get, Param } from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  /**
   * GET /api/pages/:username
   * Returns the public page for a given artist username.
   * TODO: Resolve artist → page → blocks.
   */
  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.pagesService.findByUsername(username);
  }
}
