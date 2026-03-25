import { IsString, IsOptional, IsUrl, MaxLength, MinLength, Matches } from 'class-validator';

/**
 * CreateArtistDto — validated payload for POST /api/artists
 * Full field validation aligned with DB schema (T2).
 */
export class CreateArtistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'username must be lowercase alphanumeric, dash, or underscore',
  })
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
  @IsUrl()
  avatarUrl?: string;
}

/**
 * UpdateArtistDto — PATCH /api/artists/:username
 * All fields optional.
 */
export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
