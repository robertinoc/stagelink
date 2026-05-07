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
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ArtistCategory } from '@prisma/client';
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
}
