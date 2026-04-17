import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SMART_MERCH_PROVIDERS, type SmartMerchProvider } from '@stagelink/types';

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyStringToNull(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

export class ValidateMerchConnectionDto {
  @IsIn(SMART_MERCH_PROVIDERS)
  provider!: SmartMerchProvider;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  apiToken!: string;
}

export class UpdateMerchConnectionDto {
  @IsIn(SMART_MERCH_PROVIDERS)
  provider!: SmartMerchProvider;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(trimString(value)))
  @IsString()
  @MaxLength(255)
  apiToken?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(trimString(value)))
  @IsString()
  @MaxLength(100)
  storeId?: string | null;
}

export class ListMerchProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit?: number;
}
