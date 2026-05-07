import {
  resolveDocumentLocale,
  resolveDocumentText,
  resolveFieldLevelLocalizedText,
  resolveLocalizedText,
  sanitizeLocalizedTextMap,
  sanitizeTranslationFieldMap,
} from './localized-content.util';

describe('localized-content.util', () => {
  describe('resolveDocumentLocale', () => {
    it('keeps the base locale when the requested locale is incomplete', () => {
      expect(
        resolveDocumentLocale('en', 'es', [
          {
            baseValue: 'Bio en espanol',
            localizedValue: { en: 'English bio' },
          },
          {
            baseValue: 'Rider en espanol',
            localizedValue: {},
          },
        ]),
      ).toBe('es');
    });

    it('uses the requested locale when all translated fields are present', () => {
      expect(
        resolveDocumentLocale('en', 'es', [
          {
            baseValue: 'Bio en espanol',
            localizedValue: { en: 'English bio' },
          },
          {
            baseValue: 'Rider en espanol',
            localizedValue: { en: 'English rider' },
          },
        ]),
      ).toBe('en');
    });

    it('ignores optional fields when deciding whether a document locale is complete', () => {
      expect(
        resolveDocumentLocale('en', 'es', [
          {
            baseValue: 'Bio en espanol',
            localizedValue: { en: 'English bio' },
          },
          {
            baseValue: 'Rider en espanol',
            localizedValue: {},
            required: false,
          },
        ]),
      ).toBe('en');
    });
  });

  describe('resolveDocumentText', () => {
    it('returns the base text when rendering the base locale', () => {
      expect(resolveDocumentText('Texto base', { en: 'English text' }, 'es', 'es')).toBe(
        'Texto base',
      );
    });

    it('returns only the translated text when rendering a non-base locale', () => {
      expect(resolveDocumentText('Texto base', { en: 'English text' }, 'en', 'es')).toBe(
        'English text',
      );
    });
  });

  describe('resolveLocalizedText', () => {
    it('still keeps legacy field-level fallback behavior for simple localized fields', () => {
      expect(resolveLocalizedText('Texto base', { en: 'English text' }, 'en')).toBe('English text');
      expect(resolveLocalizedText('Texto base', { en: 'English text' }, 'es')).toBe('English text');
    });
  });

  describe('resolveFieldLevelLocalizedText', () => {
    it('keeps field-by-field fallback behavior explicit for block content', () => {
      expect(resolveFieldLevelLocalizedText('Texto base', { en: 'English text' }, 'es')).toBe(
        'English text',
      );
    });
  });

  describe('sanitizeLocalizedTextMap', () => {
    it('keeps supported locales, trims text, and truncates oversized values', () => {
      expect(
        sanitizeLocalizedTextMap(
          {
            en: '  English text  ',
            es: 'Contenido largo',
            fr: 'unsupported',
          },
          { maxLength: 9 },
        ),
      ).toEqual({
        en: 'English t',
        es: 'Contenido',
      });
    });
  });

  describe('sanitizeTranslationFieldMap', () => {
    it('drops unexpected fields and applies field-specific length caps', () => {
      expect(
        sanitizeTranslationFieldMap<{
          title?: { en?: string };
          body?: { en?: string };
        }>(
          {
            title: { en: 'Short title' },
            body: { en: '1234567890' },
            unexpected: { en: 'drop me' },
          },
          {
            allowedFields: ['title', 'body'],
            maxLengthByField: {
              body: 4,
            },
          },
        ),
      ).toEqual({
        title: { en: 'Short title' },
        body: { en: '1234' },
      });
    });
  });
});
