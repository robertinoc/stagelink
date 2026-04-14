import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SHOPIFY_SELECTION_MODES, type ShopifySelectionMode } from '@stagelink/types';
import { SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES } from '../shopify.helpers';

function emptyStringToNull(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeHandleList(value: unknown): string[] | unknown {
  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }

  return value;
}

export class ValidateShopifyConnectionDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  storeDomain!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  storefrontToken!: string;
}

export class UpdateShopifyConnectionDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  storeDomain!: string;

  @IsIn(SHOPIFY_SELECTION_MODES)
  selectionMode!: ShopifySelectionMode;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(trimString(value)))
  @IsString()
  @MaxLength(120)
  collectionHandle?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyStringToNull(trimString(value)))
  @IsString()
  @MaxLength(255)
  storefrontToken?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeHandleList(value))
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  productHandles?: string[];
}
