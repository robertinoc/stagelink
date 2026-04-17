import { BadRequestException } from '@nestjs/common';

export const PRINTFUL_API_BASE_URL = 'https://api.printful.com';
export const SMART_MERCH_DEFAULT_PREVIEW_LIMIT = 6;
export const SMART_MERCH_MAX_SELECTED_PRODUCTS = 12;
export const SMART_MERCH_CACHE_TTL_MS = 60_000;

export function normalizeMerchPreviewLimit(limit: number | undefined | null): number {
  const parsed =
    typeof limit === 'number' && Number.isFinite(limit)
      ? Math.trunc(limit)
      : SMART_MERCH_DEFAULT_PREVIEW_LIMIT;
  return Math.min(Math.max(parsed, 1), SMART_MERCH_MAX_SELECTED_PRODUCTS);
}

export function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizePrintfulStoreId(storeId: string | null | undefined): string | null {
  const normalized = trimString(storeId);
  return normalized.length > 0 ? normalized : null;
}

export function normalizePriceAmount(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  return null;
}

export function assertNonEmptyToken(token: string, field = 'API token'): string {
  const normalized = trimString(token);
  if (!normalized) {
    throw new BadRequestException(`${field} is required`);
  }
  return normalized;
}
