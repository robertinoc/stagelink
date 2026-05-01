import { describe, it, expect } from 'vitest';
import { detectLocale, resolvePreferredLocale } from '@/lib/detect-locale';

describe('detectLocale()', () => {
  // ── Defaults ────────────────────────────────────────────────────────────

  it('returns "en" for an empty string', () => {
    expect(detectLocale('')).toBe('en');
  });

  it('returns "en" for undefined-like input', () => {
    expect(detectLocale('en')).toBe('en');
  });

  // ── Spanish detection ────────────────────────────────────────────────────

  it('returns "es" for exact "es" locale', () => {
    expect(detectLocale('es')).toBe('es');
  });

  it('returns "es" for "es-AR" (Argentina)', () => {
    expect(detectLocale('es-AR')).toBe('es');
  });

  it('returns "es" for "es-MX" (Mexico)', () => {
    expect(detectLocale('es-MX')).toBe('es');
  });

  it('returns "es" for "es-419" (Latin America)', () => {
    expect(detectLocale('es-419')).toBe('es');
  });

  // ── Quality-sorted Accept-Language header ────────────────────────────────

  it('picks highest-quality supported locale from Accept-Language', () => {
    // es at q=0.9 is higher than en at q=0.7
    expect(detectLocale('es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('es');
  });

  it('falls back to "en" when the highest-quality locale is unsupported', () => {
    // fr is not supported → falls back to en
    expect(detectLocale('fr-FR,fr;q=0.9,en;q=0.8')).toBe('en');
  });

  it('returns "en" when only unsupported locales are listed', () => {
    expect(detectLocale('fr,de,pt')).toBe('en');
  });

  it('returns "en" for "en-US"', () => {
    expect(detectLocale('en-US')).toBe('en');
  });

  it('returns "en" for "en-GB"', () => {
    expect(detectLocale('en-GB,en;q=0.9')).toBe('en');
  });

  // ── Malformed headers ────────────────────────────────────────────────────

  it('handles a single locale without q-value', () => {
    expect(detectLocale('es')).toBe('es');
  });

  it('handles extra whitespace gracefully', () => {
    expect(detectLocale(' es , en ;q=0.8')).toBe('es');
  });
});

describe('resolvePreferredLocale()', () => {
  // ── Cookie takes precedence ──────────────────────────────────────────────

  it('returns cookie locale when valid ("en")', () => {
    expect(resolvePreferredLocale({ localeCookie: 'en' })).toBe('en');
  });

  it('returns cookie locale when valid ("es")', () => {
    expect(resolvePreferredLocale({ localeCookie: 'es' })).toBe('es');
  });

  it('ignores unsupported cookie values and falls back to Accept-Language', () => {
    // "fr" is not supported → should fall through to header
    expect(resolvePreferredLocale({ localeCookie: 'fr', acceptLanguage: 'es' })).toBe('es');
  });

  it('ignores empty cookie string and falls back to Accept-Language', () => {
    expect(resolvePreferredLocale({ localeCookie: '', acceptLanguage: 'es' })).toBe('es');
  });

  it('ignores null cookie and falls back to Accept-Language', () => {
    expect(resolvePreferredLocale({ localeCookie: null, acceptLanguage: 'es-MX' })).toBe('es');
  });

  // ── Accept-Language fallback ─────────────────────────────────────────────

  it('uses Accept-Language header when no cookie is set', () => {
    expect(resolvePreferredLocale({ acceptLanguage: 'es' })).toBe('es');
  });

  it('defaults to "en" when neither cookie nor header is provided', () => {
    expect(resolvePreferredLocale({})).toBe('en');
  });

  it('defaults to "en" when both inputs are null', () => {
    expect(resolvePreferredLocale({ localeCookie: null, acceptLanguage: null })).toBe('en');
  });

  // ── Cookie normalisation ─────────────────────────────────────────────────

  it('trims whitespace from cookie value', () => {
    expect(resolvePreferredLocale({ localeCookie: '  es  ' })).toBe('es');
  });

  it('is case-insensitive for cookie value', () => {
    expect(resolvePreferredLocale({ localeCookie: 'ES' })).toBe('es');
  });
});
