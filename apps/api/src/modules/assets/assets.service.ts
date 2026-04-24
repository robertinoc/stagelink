import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../lib/prisma.service';
import { S3Service } from '../../lib/s3/s3.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { ASSET_CONFIG, PRESIGNED_URL_TTL_SECONDS } from './assets.constants';
import type { AssetDto, CreateUploadIntentDto, UploadIntentResponseDto } from './dto';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create an upload intent:
   * 1. Validate ownership (user must own the artist)
   * 2. Validate mime type + size for the given kind
   * 3. Create Asset record (status: pending)
   * 4. Generate presigned PUT URL
   */
  async createUploadIntent(
    dto: CreateUploadIntentDto,
    user: User,
  ): Promise<UploadIntentResponseDto> {
    // 1. Membership check — user must have write access to this artist
    await this.membershipService.validateAccess(user.id, dto.artistId, 'write');

    // 2. Validate asset kind config
    const config = ASSET_CONFIG[dto.kind];
    if (!config) throw new BadRequestException(`Unsupported asset kind: ${dto.kind}`);

    if (!config.allowedMimeTypes.includes(dto.mimeType as never)) {
      throw new BadRequestException(`MIME type ${dto.mimeType} is not allowed for ${dto.kind}`);
    }
    if (dto.sizeBytes > config.maxSizeBytes) {
      throw new BadRequestException(
        `File too large: max ${config.maxSizeBytes / (1024 * 1024)} MB for ${dto.kind}`,
      );
    }

    // 3. Generate object key (backend controls this — never trust client)
    const objectKey = this.s3.generateObjectKey(
      dto.artistId,
      dto.kind,
      dto.originalFilename ?? `upload.${dto.mimeType.split('/')[1]}`,
    );

    // 4. Create Asset in DB with status: pending
    const asset = await this.prisma.asset.create({
      data: {
        artistId: dto.artistId,
        kind: dto.kind as 'avatar' | 'cover' | 'epk_image' | 'profile_gallery',
        bucket: this.s3.getBucket(),
        objectKey,
        originalFilename: dto.originalFilename ?? null,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        status: 'pending',
        createdByUserId: user.id,
      },
    });

    // 5. Generate presigned PUT URL
    const { uploadUrl, expiresAt } = await this.s3.generatePresignedPutUrl(
      objectKey,
      dto.mimeType,
      PRESIGNED_URL_TTL_SECONDS,
    );

    this.logger.log(
      `Upload intent created: assetId=${asset.id} kind=${dto.kind} artistId=${dto.artistId}`,
    );

    this.auditService.log({
      actorId: user.id,
      action: 'asset.upload.intent',
      entityType: 'asset',
      entityId: asset.id,
      metadata: { artistId: dto.artistId, kind: dto.kind },
    });

    return {
      assetId: asset.id,
      uploadUrl,
      objectKey,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Confirm an upload:
   * 1. Validate ownership
   * 2. Mark asset as uploaded
   * 3. Set deliveryUrl
   * 4. Update artist's avatarAssetId or coverAssetId
   */
  async confirmUpload(assetId: string, user: User): Promise<AssetDto> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) throw new NotFoundException('Asset not found');
    // Membership check — user must have write access to this artist
    await this.membershipService.validateAccess(user.id, asset.artistId, 'write');
    if (asset.status !== 'pending') {
      throw new BadRequestException(`Asset is already ${asset.status}`);
    }

    const deliveryUrl = this.s3.buildDeliveryUrl(asset.objectKey);

    // Update asset status + delivery URL
    const updated = await this.prisma.asset.update({
      where: { id: assetId },
      data: { status: 'uploaded', deliveryUrl },
    });

    // Update artist's current avatar or cover reference
    if (asset.kind === 'avatar') {
      await this.prisma.artist.update({
        where: { id: asset.artistId },
        data: { avatarAssetId: assetId, avatarUrl: deliveryUrl },
      });
    } else if (asset.kind === 'cover') {
      await this.prisma.artist.update({
        where: { id: asset.artistId },
        data: { coverAssetId: assetId, coverUrl: deliveryUrl },
      });
    }

    this.logger.log(`Upload confirmed: assetId=${assetId} kind=${asset.kind}`);

    this.auditService.log({
      actorId: user.id,
      action: 'asset.upload.confirm',
      entityType: 'asset',
      entityId: assetId,
      metadata: { artistId: asset.artistId, kind: asset.kind },
    });

    return this.toDto(updated);
  }

  async listByArtist(artistId: string, user: User): Promise<AssetDto[]> {
    await this.membershipService.validateAccess(user.id, artistId, 'read');

    const assets = await this.prisma.asset.findMany({
      where: {
        artistId,
        status: 'uploaded',
        kind: { in: ['avatar', 'cover', 'epk_image', 'profile_gallery'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map((asset) => this.toDto(asset));
  }

  private toDto(asset: {
    id: string;
    artistId: string;
    kind: string;
    mimeType: string;
    sizeBytes: number;
    deliveryUrl: string | null;
    status: string;
    createdAt: Date;
  }): AssetDto {
    return {
      id: asset.id,
      artistId: asset.artistId,
      kind: asset.kind,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      deliveryUrl: asset.deliveryUrl,
      status: asset.status,
      createdAt: asset.createdAt.toISOString(),
    };
  }
}
