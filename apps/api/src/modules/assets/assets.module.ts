import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

/**
 * AssetsModule — upload pipeline.
 *
 * S3Service is provided globally via S3Module (imported in AppModule).
 * PrismaService is provided globally via PrismaModule.
 * Neither needs to be imported here.
 */
@Module({
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
