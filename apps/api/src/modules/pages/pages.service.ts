import { Injectable } from '@nestjs/common';

@Injectable()
export class PagesService {
  /**
   * TODO: Query page by artist username.
   * Returns page metadata + ordered blocks.
   */
  findByUsername(username: string) {
    return {
      data: null,
      username,
      message: 'Page stub — DB integration pending',
    };
  }
}
