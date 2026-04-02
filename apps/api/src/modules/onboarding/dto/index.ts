import { ArtistCategory } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class CheckUsernameQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
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
  @IsArray()
  @ArrayUnique()
  @IsEnum(ArtistCategory, { each: true })
  secondaryCategories?: ArtistCategory[];
}
