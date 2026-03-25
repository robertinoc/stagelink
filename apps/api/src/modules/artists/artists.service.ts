import { Injectable } from '@nestjs/common';

@Injectable()
export class ArtistsService {
  /**
   * TODO: Replace with DB query via repository.
   */
  findAll() {
    return {
      data: [],
      message: 'Artists stub — DB integration pending',
    };
  }

  /**
   * Core multi-tenant lookup: username → artist.
   * TODO: Query by username, throw NotFoundException if not found.
   */
  findByUsername(username: string) {
    return {
      data: null,
      username,
      message: 'Artist lookup stub — DB integration pending',
    };
  }
}
