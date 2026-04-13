import {
  resolveDocumentLocale,
  resolveDocumentText,
  resolveLocalizedText,
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
});
