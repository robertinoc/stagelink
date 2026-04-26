import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators';
import { UploadRateLimitGuard } from '../../common/guards';
import { AssetsService } from './assets.service';
import { CreateUploadIntentDto } from './dto';

/**
 * AssetsController — upload pipeline endpoints.
 *
 * All routes require JWT auth (APP_GUARD global).
 *
 * Routes:
 *   POST /api/assets/upload-intent   → create intent + presigned PUT URL
 *   POST /api/assets/:id/confirm     → confirm upload + update artist
 */
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('artist/:artistId')
  listByArtist(@Param('artistId') artistId: string, @CurrentUser() user: User) {
    return this.assetsService.listByArtist(artistId, user);
  }

  /**
   * POST /api/assets/upload-intent
   *
   * Request a presigned PUT URL for a direct browser → S3 upload.
   * Backend validates ownership, mime type, and size.
   * Returns an Asset record (status: pending) + presigned URL.
   *
   * Rate-limited: 20 intents / 60 s per user to prevent presigned-URL abuse.
   */
  @UseGuards(UploadRateLimitGuard)
  @Post('upload-intent')
  createUploadIntent(@Body() dto: CreateUploadIntentDto, @CurrentUser() user: User) {
    return this.assetsService.createUploadIntent(dto, user);
  }

  /**
   * POST /api/assets/:id/confirm
   *
   * Confirm that a browser upload to S3 completed successfully.
   * Marks the asset as `uploaded` and updates the artist's avatar/cover.
   */
  @Post(':id/confirm')
  confirmUpload(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assetsService.confirmUpload(id, user);
  }
}
