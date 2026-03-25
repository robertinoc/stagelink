import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

/**
 * CreatePageDto — POST /api/pages (create public page for an artist)
 */
export class CreatePageDto {
  @IsString()
  artistId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

/**
 * UpdatePageDto — PATCH /api/pages/:username
 */
export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
