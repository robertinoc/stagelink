import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsIn,
  IsUrl,
  ValidateNested,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SMART_LINK_PLATFORMS } from '@stagelink/types';

const MAX_LABEL_LENGTH = 100;
const MAX_DEST_LABEL_LENGTH = 100;
const MAX_DESTINATIONS = 4; // one per platform variant

// =============================================================
// SmartLinkDestinationDto — sub-object inside create/update payloads
// =============================================================
export class SmartLinkDestinationDto {
  /** Stable client-generated UUID — required on update, optional on create. */
  @IsOptional()
  @IsString()
  id?: string;

  @IsIn(SMART_LINK_PLATFORMS as unknown as string[])
  platform!: (typeof SMART_LINK_PLATFORMS)[number];

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_DEST_LABEL_LENGTH)
  label?: string;
}

// =============================================================
// CreateSmartLinkDto — POST /api/artists/:artistId/smart-links
// =============================================================
export class CreateSmartLinkDto {
  @IsString()
  @MaxLength(MAX_LABEL_LENGTH)
  label!: string;

  @IsArray()
  @ArrayMaxSize(MAX_DESTINATIONS)
  @ValidateNested({ each: true })
  @Type(() => SmartLinkDestinationDto)
  destinations!: SmartLinkDestinationDto[];
}

// =============================================================
// UpdateSmartLinkDto — PATCH /api/smart-links/:id
// =============================================================
export class UpdateSmartLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_LABEL_LENGTH)
  label?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_DESTINATIONS)
  @ValidateNested({ each: true })
  @Type(() => SmartLinkDestinationDto)
  destinations?: SmartLinkDestinationDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
