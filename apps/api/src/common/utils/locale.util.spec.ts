import { detectLocale } from './locale.util';

describe('detectLocale() — API tier', () => {
  // ── Default fallback ──────────────────────────────────────────────────────

  it('returns "en" for an empty string', () => {
    expect(detectLocale('')).toBe('en');
  });

  it('returns "en" when Accept-Language is undefined-like (empty)', () => {
    expect(detectLocale('')).toBe('en');
  });

  // ── Exact locale match ────────────────────────────────────────────────────

  it('returns "en" for exact "en"', () => {
    expect(detectLocale('en')).toBe('en');
  });

  it('returns "es" for exact "es"', () => {
    expect(detectLocale('es')).toBe('es');
  });

  // ── Language-prefix matching ──────────────────────────────────────────────

  it('returns "en" for "en-US"', () => {
    expect(detectLocale('en-US')).toBe('en');
  });

  it('returns "en" for "en-GB"', () => {
    expect(detectLocale('en-GB')).toBe('en');
  });

  it('returns "es" for "es-AR"', () => {
    expect(detectLocale('es-AR')).toBe('es');
  });

  it('returns "es" for "es-MX"', () => {
    expect(detectLocale('es-MX')).toBe('es');
  });

  it('returns "es" for "es-419" (Latin America)', () => {
    expect(detectLocale('es-419')).toBe('es');
  });

  // ── Quality-sorted Accept-Language headers ────────────────────────────────

  it('picks highest-quality supported locale (es before en)', () => {
    expect(detectLocale('es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('es');
  });

  it('returns "en" when the top locale is unsupported (fr)', () => {
    expect(detectLocale('fr-FR,fr;q=0.9,en;q=0.8')).toBe('en');
  });

  it('picks the locale with the highest q-value', () => {
    // en at 0.9, es at 0.5 — en wins
    expect(detectLocale('en;q=0.9,es;q=0.5')).toBe('en');
  });

  it('returns "en" when only unsupported locales are listed', () => {
    expect(detectLocale('fr,de,pt-BR')).toBe('en');
  });

  // ── Whitespace handling ───────────────────────────────────────────────────

  it('handles extra whitespace in Accept-Language header', () => {
    expect(detectLocale(' es , en ;q=0.8')).toBe('es');
  });

  // ── Implicit q=1.0 for locales without explicit quality ──────────────────

  it('treats locales without q-value as q=1.0 (highest priority)', () => {
    expect(detectLocale('es,en;q=0.5')).toBe('es');
  });
});
