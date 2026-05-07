import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  EPK_AI_TONES,
  SUPPORTED_LOCALES,
  type EpkAiTone,
  type SupportedLocale,
} from '@stagelink/types';

function emptyStringToNull(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

export class EpkFeaturedMediaItemDto {
  @IsString()
  @MaxLength(64)
  id!: string;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @IsIn(['spotify', 'soundcloud', 'youtube', 'other'])
  provider!: 'spotify' | 'soundcloud' | 'youtube' | 'other';
}

export class EpkFeaturedLinkItemDto {
  @IsString()
  @MaxLength(64)
  id!: string;

  @IsString()
  @MaxLength(100)
  label!: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;
}

export class UpdateEpkDto {
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  baseLocale?: SupportedLocale;

  @IsOptional()
  @IsObject()
  translations?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(140)
  headline?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(500)
  shortBio?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(5000)
  fullBio?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(280)
  pressQuote?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsEmail()
  bookingEmail?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(200)
  managementContact?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(200)
  pressContact?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  heroImageUrl?: string | null;

  @IsOptional()
  @IsArray()
  // 2 reserved slots (hero + portrait) + up to 6 extra gallery photos = 8 max.
  @ArrayMaxSize(8)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { each: true })
  galleryImageUrls?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => EpkFeaturedMediaItemDto)
  featuredMedia?: EpkFeaturedMediaItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => EpkFeaturedLinkItemDto)
  featuredLinks?: EpkFeaturedLinkItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  highlights?: string[];

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(2000)
  riderInfo?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(2000)
  techRequirements?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(500)
  availabilityNotes?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(value))
  @IsString()
  @MaxLength(500)
  recordLabels?: string | null;
}

export class GenerateBioDto {
  @IsString()
  @MaxLength(200)
  genre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  influences?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  highlights?: string[];

  @IsIn(EPK_AI_TONES)
  tone!: EpkAiTone;
}
