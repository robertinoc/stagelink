import { Injectable, NotFoundException } from '@nestjs/common';
import type { Artist } from '@stagelink/types';

@Injectable()
export class ArtistsService {
  // TODO: inject DB repository
  async findByUsername(username: string): Promise<Artist> {
    // placeholder until DB is wired
    throw new NotFoundException(`Artist @${username} not found`);
  }
}
