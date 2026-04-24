import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ALLOWED_MIME_TYPES } from '../assets.constants';

const VALID_KINDS = ['avatar', 'cover', 'epk_image', 'profile_gallery'] as const;
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB hard ceiling

export class CreateUploadIntentDto {
  @IsString()
  @IsNotEmpty()
  artistId!: string;

  @IsIn(VALID_KINDS)
  kind!: 'avatar' | 'cover' | 'epk_image' | 'profile_gallery';

  @IsIn([...ALLOWED_MIME_TYPES])
  mimeType!: string;

  @IsNumber()
  @Min(1)
  @Max(MAX_SIZE_BYTES)
  sizeBytes!: number;

  @IsString()
  @IsOptional()
  originalFilename?: string;
}

export class UploadIntentResponseDto {
  assetId!: string;
  uploadUrl!: string;
  objectKey!: string;
  expiresAt!: string; // ISO 8601
}

export class AssetDto {
  id!: string;
  artistId!: string;
  kind!: string;
  mimeType!: string;
  sizeBytes!: number;
  deliveryUrl!: string | null;
  status!: string;
  createdAt!: string;
}
