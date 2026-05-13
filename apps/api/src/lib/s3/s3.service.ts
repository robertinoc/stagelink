import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import * as nodePath from 'node:path';

export interface PresignedPutUrl {
  uploadUrl: string;
  objectKey: string;
  expiresAt: Date;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('s3.region');
    const accessKeyId = this.configService.getOrThrow<string>('s3.accessKeyId');
    const secretAccessKey = this.configService.getOrThrow<string>('s3.secretAccessKey');
    const endpoint = this.configService.get<string | undefined>('s3.endpoint');

    this.bucket = this.configService.getOrThrow<string>('s3.bucket');
    this.publicBaseUrl = this.configService.getOrThrow<string>('s3.publicBaseUrl');

    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
  }

  /**
   * Generate a presigned PUT URL for direct browser → S3 upload.
   * The browser PUTs the raw file bytes to this URL.
   * Expires in `expiresIn` seconds (default 300 = 5 min).
   */
  async generatePresignedPutUrl(
    objectKey: string,
    mimeType: string,
    expiresIn = 300,
  ): Promise<PresignedPutUrl> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { uploadUrl, objectKey, expiresAt };
  }

  /**
   * Verify that an object exists and still matches the expected upload contract
   * before the API marks an Asset row as uploaded.
   */
  async verifyUploadedObject(
    objectKey: string,
    expectedMimeType: string,
    maxSizeBytes: number,
    minSizeBytes = 1,
  ): Promise<void> {
    const result = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );

    const contentLength = result.ContentLength ?? 0;
    if (contentLength < minSizeBytes) {
      throw new Error(`Uploaded object is smaller than minimum size: ${objectKey}`);
    }
    if (contentLength > maxSizeBytes) {
      throw new Error(`Uploaded object exceeds max size: ${objectKey}`);
    }
    if (!result.ContentType) {
      throw new Error(`Uploaded object content type is missing: ${objectKey}`);
    }
    if (result.ContentType !== expectedMimeType) {
      throw new Error(`Uploaded object content type mismatch: ${objectKey}`);
    }
  }

  /**
   * Build the public delivery URL for a given object key.
   * Compatible with CDN prefix (Cloudflare, CloudFront, etc.).
   */
  buildDeliveryUrl(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  /**
   * Generate a tenant-scoped, collision-free object key.
   * Pattern: artists/{artistId}/{kind}/{uuid}.{ext}
   * The client NEVER controls this path.
   */
  generateObjectKey(artistId: string, kind: string, originalFilename: string): string {
    const raw = nodePath.extname(originalFilename).toLowerCase();
    // Strip anything that's not alphanumeric or dot to prevent path injection
    const ext = /^\.[a-z0-9]+$/.test(raw) ? raw : '';
    return `artists/${artistId}/${kind}/${randomUUID()}${ext}`;
  }

  getBucket(): string {
    return this.bucket;
  }
}
