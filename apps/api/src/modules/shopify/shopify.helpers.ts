import { BadRequestException } from '@nestjs/common';

export const SHOPIFY_STOREFRONT_API_VERSION = '2026-01';
export const SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES = 12;
export const SHOPIFY_DEFAULT_PREVIEW_LIMIT = 4;
export const SHOPIFY_MAX_PREVIEW_LIMIT = 8;

const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/;
const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeShopifyStoreDomain(rawValue: string): string {
  const trimmed = rawValue.trim().toLowerCase();
  if (!trimmed) {
    throw new BadRequestException('Store domain is required');
  }

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new BadRequestException('Store domain must be a valid hostname');
  }

  if (
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new BadRequestException('Store domain must only contain the hostname');
  }

  const hostname = parsed.hostname.replace(/^www\./, '');

  if (!HOSTNAME_PATTERN.test(hostname)) {
    throw new BadRequestException('Store domain must be a valid hostname');
  }

  return hostname;
}

export function normalizeShopifyHandle(rawValue: string, field: string): string {
  const normalized = rawValue
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    throw new BadRequestException(`${field} is required`);
  }

  if (!HANDLE_PATTERN.test(normalized)) {
    throw new BadRequestException(
      `${field} must contain only lowercase letters, numbers, hyphens, or underscores`,
    );
  }

  return normalized;
}

export function normalizeProductHandles(rawHandles: string[]): string[] {
  const cleaned = rawHandles
    .map((handle, index) => normalizeShopifyHandle(handle, `Product handle #${index + 1}`))
    .filter((handle, index, array) => array.indexOf(handle) === index);

  if (cleaned.length === 0) {
    throw new BadRequestException('At least one product handle is required');
  }

  if (cleaned.length > SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES) {
    throw new BadRequestException(
      `You can select up to ${SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES} Shopify products`,
    );
  }

  return cleaned;
}

export function resolvePreviewLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return SHOPIFY_DEFAULT_PREVIEW_LIMIT;
  return Math.max(1, Math.min(SHOPIFY_MAX_PREVIEW_LIMIT, Math.floor(value)));
}
