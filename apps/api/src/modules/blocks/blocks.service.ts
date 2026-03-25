import { Injectable } from '@nestjs/common';

@Injectable()
export class BlocksService {
  /**
   * Block types: link | music_embed | video_embed | fan_email_capture
   * TODO: Query blocks by pageId, sorted by position.
   */
  findByPage(pageId: string) {
    return {
      data: [],
      pageId,
      message: 'Blocks stub — DB integration pending',
    };
  }
}
