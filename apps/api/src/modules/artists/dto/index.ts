import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsEnum,
  IsIn,
  IsArray,
  ArrayUnique,
  ArrayMaxSize,
  MaxLength,
  MinLength,
  Matches,
  IsObject,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Max,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ArtistCategory } from '@prisma/client';
import { ARTIST_RELEASE_TYPES, type ArtistReleaseType } from '@stagelink/types';
import {
  normalizeUsername,
  validateUsernameFormat,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../../../common/utils/username.util';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@stagelink/types';
import { isReservedUsername } from '../../../common/constants/reserved-usernames';

// ── Decorador personalizado: username no reservado ─────────────

@ValidatorConstraint({ name: 'isNotReservedUsername', async: false })
class IsNotReservedUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;
    const normalized = normalizeUsername(value);
    const formatResult = validateUsernameFormat(normalized);
    if (!formatResult.valid) return true; // Deja que Matches() lo rechace
    return !isReservedUsername(normalized);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Username is reserved and cannot be used';
  }
}

function IsNotReservedUsername(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotReservedUsernameConstraint,
    });
  };
}

// ── DTOs ───────────────────────────────────────────────────────

/**
 * CreateArtistDto — payload validado para POST /api/artists
 *
 * Reglas de username (fuente: username.util.ts):
 * - Normalizado a lowercase antes de validar (via @Transform)
 * - Solo letras minúsculas, dígitos, guión medio (-) y guión bajo (_)
 * - Mínimo 3 caracteres, máximo 30
 * - Debe empezar y terminar con letra o dígito
 * - No puede contener -- ni __
 * - No puede ser una palabra reservada (reserved-usernames.ts)
 */
export class CreateArtistDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeUsername(value) : value))
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH)
  @MaxLength(USERNAME_MAX_LENGTH)
  @Matches(/^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$/, {
    message:
      'username must start and end with a letter or number, and only contain letters, numbers, hyphens (-), or underscores (_)',
  })
  @Matches(/^(?!.*[-_]{2,}).*$/, {
    message: 'username cannot contain consecutive hyphens or underscores (-- or __)',
  })
  @IsNotReservedUsername()
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  fullBio?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  avatarUrl?: string;
}

/**
 * UpdateArtistDto — PATCH /api/artists/:id
 *
 * Username is NOT editable — it is the public multi-tenant key.
 * Avatar and cover are managed exclusively through the assets pipeline.
 * All fields are optional (partial update).
 *
 * URL fields: empty string is transformed to null (allows clearing a link).
 * Email field: same empty → null transform.
 */
export class UpdateArtistDto {
  // ── Basic info ───────────────────────────────────────────────

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  fullBio?: string | null;

  @IsOptional()
  @IsEnum(ArtistCategory, { message: 'category must be a valid ArtistCategory' })
  category?: ArtistCategory;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(2, { message: 'You can choose up to 2 secondary categories' })
  @IsEnum(ArtistCategory, {
    each: true,
    message: 'secondaryCategories must contain only valid ArtistCategory values',
  })
  secondaryCategories?: ArtistCategory[];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(6, { message: 'You can choose up to 6 descriptors' })
  @IsString({ each: true, message: 'tags must contain only strings' })
  @MaxLength(24, {
    each: true,
    message: 'Each descriptor must be 24 characters or less',
  })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(6, { message: 'You can upload up to 6 gallery images' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { each: true, message: 'galleryImageUrls must contain only valid URLs' },
  )
  galleryImageUrls?: string[];

  // ── Social links ─────────────────────────────────────────────

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'instagramUrl must be a valid URL' },
  )
  instagramUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'tiktokUrl must be a valid URL' },
  )
  tiktokUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'youtubeUrl must be a valid URL' },
  )
  youtubeUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'spotifyUrl must be a valid URL' },
  )
  spotifyUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'soundcloudUrl must be a valid URL' },
  )
  soundcloudUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'websiteUrl must be a valid URL' },
  )
  websiteUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsEmail({}, { message: 'contactEmail must be a valid email address' })
  contactEmail?: string | null;

  // ── Streaming platforms (REQ-06) ─────────────────────────────
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'appleMusicUrl must be a valid URL' })
  appleMusicUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'amazonMusicUrl must be a valid URL' })
  amazonMusicUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'deezerUrl must be a valid URL' })
  deezerUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'tidalUrl must be a valid URL' })
  tidalUrl?: string | null;

  // ── Music stores (REQ-07) ─────────────────────────────────────
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'beatportUrl must be a valid URL' })
  beatportUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'traxsourceUrl must be a valid URL' })
  traxsourceUrl?: string | null;

  // ── Link visibility ───────────────────────────────────────────
  // Keys of social links that should appear on the public artist page.
  // Empty array = legacy mode (all non-null links are shown).

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  shownLinks?: string[];

  // ── SEO ──────────────────────────────────────────────────────

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'SEO title must be 60 characters or less' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160, { message: 'SEO description must be 160 characters or less' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  seoDescription?: string | null;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES, { message: 'baseLocale must be a supported locale' })
  baseLocale?: SupportedLocale;

  @IsOptional()
  @IsObject()
  translations?: Record<string, unknown>;

  // ── Record labels ─────────────────────────────────────────────

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'You can add up to 10 record labels' })
  @ValidateNested({ each: true })
  @Type(() => RecordLabelDto)
  recordLabels?: RecordLabelDto[];

  // ── Releases / EPs / Albums (REQ-10) ─────────────────────────

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: 'You can add up to 50 releases' })
  @ValidateNested({ each: true })
  @Type(() => ReleaseDto)
  releases?: ReleaseDto[];

  // ── Public counters (REQ-11) ──────────────────────────────────
  // Both counters are nullable on purpose: `null` (or empty string from the
  // form) clears the value and hides the corresponding row on the landing page.

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
  })
  @IsInt({ message: 'epsReleasedCount must be a whole number' })
  @Min(0, { message: 'epsReleasedCount must be 0 or greater' })
  @Max(99999, { message: 'epsReleasedCount must be 99999 or less' })
  epsReleasedCount?: number | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
  })
  @IsInt({ message: 'externalCollabsCount must be a whole number' })
  @Min(0, { message: 'externalCollabsCount must be 0 or greater' })
  @Max(99999, { message: 'externalCollabsCount must be 99999 or less' })
  externalCollabsCount?: number | null;
}

/**
 * ReleaseDto — single entry in `UpdateArtistDto.releases`.
 *
 * Mirrors the `RecordLabelDto` style: `id` is a UUID generated client-side,
 * URL fields use the `emptyToNull` transform so the editor can clear them.
 * `releaseDate` is a string ("YYYY" or "YYYY-MM-DD") for cheap validation.
 */
export class ReleaseDto {
  @IsString()
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(1, { message: 'Release title is required' })
  @MaxLength(200, { message: 'Release title must be 200 characters or less' })
  title!: string;

  @IsIn(ARTIST_RELEASE_TYPES, { message: 'Release type must be one of the supported values' })
  type!: ArtistReleaseType;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsString()
  @MaxLength(10, { message: 'releaseDate must be a year (YYYY) or full date (YYYY-MM-DD)' })
  @Matches(/^\d{4}(-\d{2}-\d{2})?$/, {
    message: 'releaseDate must match YYYY or YYYY-MM-DD',
  })
  releaseDate?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'coverUrl must be a valid URL' })
  coverUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'spotifyUrl must be a valid URL' })
  spotifyUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsString()
  @MaxLength(100, { message: 'label must be 100 characters or less' })
  label?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsString()
  @MaxLength(500, { message: 'description must be 500 characters or less' })
  description?: string | null;
}

export class RecordLabelDto {
  @IsString()
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(1, { message: 'Label name is required' })
  @MaxLength(100, { message: 'Label name must be 100 characters or less' })
  name!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'websiteUrl must be a valid URL' })
  websiteUrl?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl({ require_protocol: true }, { message: 'logoUrl must be a valid URL' })
  logoUrl?: string | null;
}
