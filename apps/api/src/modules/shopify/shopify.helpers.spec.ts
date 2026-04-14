import { BadRequestException } from '@nestjs/common';
import {
  normalizeProductHandles,
  normalizeShopifyHandle,
  normalizeShopifyStoreDomain,
  resolvePreviewLimit,
  SHOPIFY_DEFAULT_PREVIEW_LIMIT,
  SHOPIFY_MAX_PREVIEW_LIMIT,
  SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES,
} from './shopify.helpers';

describe('shopify.helpers', () => {
  describe('normalizeShopifyStoreDomain', () => {
    it('normalizes store hostnames and strips protocol and www', () => {
      expect(normalizeShopifyStoreDomain('HTTPS://WWW.Artist-Store.MyShopify.com')).toBe(
        'artist-store.myshopify.com',
      );
    });

    it('rejects domains with paths', () => {
      expect(() =>
        normalizeShopifyStoreDomain('artist-store.myshopify.com/products/hoodie'),
      ).toThrow(BadRequestException);
    });

    it('rejects empty values', () => {
      expect(() => normalizeShopifyStoreDomain('   ')).toThrow('Store domain is required');
    });
  });

  describe('normalizeShopifyHandle', () => {
    it('normalizes lowercase handles', () => {
      expect(normalizeShopifyHandle('  FEATURED-DROPS  ', 'Collection handle')).toBe(
        'featured-drops',
      );
    });

    it('rejects invalid characters', () => {
      expect(() => normalizeShopifyHandle('Featured Drops', 'Collection handle')).toThrow(
        'Collection handle must contain only lowercase letters, numbers, hyphens, or underscores',
      );
    });
  });

  describe('normalizeProductHandles', () => {
    it('deduplicates handles while preserving order', () => {
      expect(normalizeProductHandles(['hoodie-black', 'vinyl-edition', 'hoodie-black'])).toEqual([
        'hoodie-black',
        'vinyl-edition',
      ]);
    });

    it('requires at least one valid handle', () => {
      expect(() => normalizeProductHandles([])).toThrow('At least one product handle is required');
    });

    it('rejects selections that exceed the supported limit', () => {
      const handles = Array.from(
        { length: SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES + 1 },
        (_, index) => `product-${index + 1}`,
      );

      expect(() => normalizeProductHandles(handles)).toThrow(
        `You can select up to ${SHOPIFY_MAX_SELECTED_PRODUCT_HANDLES} Shopify products`,
      );
    });
  });

  describe('resolvePreviewLimit', () => {
    it('uses the default preview limit for invalid values', () => {
      expect(resolvePreviewLimit(undefined)).toBe(SHOPIFY_DEFAULT_PREVIEW_LIMIT);
      expect(resolvePreviewLimit('4')).toBe(SHOPIFY_DEFAULT_PREVIEW_LIMIT);
    });

    it('clamps preview limits inside the supported range', () => {
      expect(resolvePreviewLimit(0)).toBe(1);
      expect(resolvePreviewLimit(3.9)).toBe(3);
      expect(resolvePreviewLimit(999)).toBe(SHOPIFY_MAX_PREVIEW_LIMIT);
    });
  });
});
