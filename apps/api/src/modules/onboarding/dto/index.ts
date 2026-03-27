import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ArtistCategory } from '@prisma/client';

export class CheckUsernameQueryDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class CompleteOnboardingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  username!: string;

  @IsEnum(ArtistCategory)
  category!: ArtistCategory;

  @IsOptional()
  @IsString()
  assetId?: string;
}
