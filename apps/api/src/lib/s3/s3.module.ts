import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';

/**
 * S3Module — global module that provides S3Service.
 * Marked @Global() so AssetsModule (and future modules) can inject
 * S3Service without re-importing S3Module everywhere.
 */
@Global()
@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
