import {
  normalizeMerchPreviewLimit,
  normalizePriceAmount,
  normalizePrintfulStoreId,
  SMART_MERCH_DEFAULT_PREVIEW_LIMIT,
} from './merch.helpers';

describe('merch.helpers', () => {
  describe('normalizeMerchPreviewLimit', () => {
    it('uses the default preview limit for invalid values', () => {
      expect(normalizeMerchPreviewLimit(undefined)).toBe(SMART_MERCH_DEFAULT_PREVIEW_LIMIT);
      expect(normalizeMerchPreviewLimit(null)).toBe(SMART_MERCH_DEFAULT_PREVIEW_LIMIT);
    });

    it('clamps preview limits inside the supported range', () => {
      expect(normalizeMerchPreviewLimit(0)).toBe(1);
      expect(normalizeMerchPreviewLimit(4.9)).toBe(4);
      expect(normalizeMerchPreviewLimit(999)).toBe(12);
    });
  });

  describe('normalizePrintfulStoreId', () => {
    it('trims valid store ids', () => {
      expect(normalizePrintfulStoreId(' 12345 ')).toBe('12345');
    });

    it('returns null for empty values', () => {
      expect(normalizePrintfulStoreId('   ')).toBeNull();
      expect(normalizePrintfulStoreId(null)).toBeNull();
    });
  });

  describe('normalizePriceAmount', () => {
    it('keeps valid string amounts', () => {
      expect(normalizePriceAmount('19.99')).toBe('19.99');
    });

    it('formats numeric amounts', () => {
      expect(normalizePriceAmount(19)).toBe('19.00');
    });

    it('returns null for invalid values', () => {
      expect(normalizePriceAmount(undefined)).toBeNull();
      expect(normalizePriceAmount('   ')).toBeNull();
    });
  });
});
