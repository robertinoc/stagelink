import { describe, it, expect } from 'vitest';
import {
  epkFormSchema,
  epkFeaturedMediaSchema,
  epkFeaturedLinkSchema,
} from '@/features/epk/schemas/epk.schema';

// ---------------------------------------------------------------------------
// Minimal valid payload — all required fields for publish readiness
// ---------------------------------------------------------------------------

const validBase = {
  baseLocale: 'en' as const,
  headline: 'The Best Artist',
  shortBio: 'A short bio.',
  fullBio: 'A much longer biography for the full press kit.',
  pressQuote: null,
  bookingEmail: 'booking@artist.com',
  managementContact: null,
  pressContact: null,
  heroImageUrl: null,
  galleryImageUrls: [],
  featuredMedia: [
    {
      id: 'media-1',
      title: 'My Song',
      url: 'https://open.spotify.com/track/1',
      provider: 'spotify' as const,
    },
  ],
  featuredLinks: [],
  highlights: [],
  riderInfo: null,
  techRequirements: null,
  location: null,
  availabilityNotes: null,
  recordLabels: null,
  translations: { en: {}, es: {} },
};

function parse(overrides: object = {}) {
  return epkFormSchema.safeParse({ ...validBase, ...overrides });
}

describe('epkFormSchema', () => {
  // ── Happy path ───────────────────────────────────────────────────────────

  it('accepts a fully valid EPK payload', () => {
    const result = parse();
    expect(result.success).toBe(true);
  });

  it('accepts a gallery image URL in place of featuredMedia', () => {
    const result = parse({
      featuredMedia: [],
      galleryImageUrls: ['https://example.com/photo.jpg'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts managementContact as public contact instead of bookingEmail', () => {
    const result = parse({ bookingEmail: null, managementContact: 'manager@artist.com' });
    expect(result.success).toBe(true);
  });

  // ── Required field validation via superRefine ────────────────────────────

  it('rejects when headline is missing', () => {
    const result = parse({ headline: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('headline');
    }
  });

  it('rejects when shortBio is missing', () => {
    const result = parse({ shortBio: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('shortBio');
    }
  });

  it('rejects when fullBio is missing', () => {
    const result = parse({ fullBio: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('fullBio');
    }
  });

  it('rejects when neither featuredMedia nor galleryImageUrls are provided', () => {
    const result = parse({ featuredMedia: [], galleryImageUrls: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('featuredMedia');
    }
  });

  it('rejects when no public contact is provided (bookingEmail, managementContact, pressContact all null)', () => {
    const result = parse({
      bookingEmail: null,
      managementContact: null,
      pressContact: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('bookingEmail');
    }
  });

  // ── String length limits ─────────────────────────────────────────────────

  it('rejects headline longer than 140 characters', () => {
    const result = parse({ headline: 'a'.repeat(141) });
    expect(result.success).toBe(false);
  });

  it('accepts headline at exactly 140 characters', () => {
    const result = parse({ headline: 'a'.repeat(140) });
    expect(result.success).toBe(true);
  });

  it('rejects shortBio longer than 500 characters', () => {
    const result = parse({ shortBio: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('rejects fullBio longer than 5000 characters', () => {
    const result = parse({ fullBio: 'a'.repeat(5001) });
    expect(result.success).toBe(false);
  });

  // ── Array limits ─────────────────────────────────────────────────────────

  it('rejects galleryImageUrls with more than 8 entries', () => {
    const urls = Array(9).fill('https://example.com/photo.jpg');
    const result = parse({ galleryImageUrls: urls });
    expect(result.success).toBe(false);
  });

  it('rejects featuredMedia with more than 6 entries', () => {
    const media = Array(7).fill({
      id: 'x',
      title: 'Track',
      url: 'https://spotify.com/t/1',
      provider: 'spotify',
    });
    const result = parse({ featuredMedia: media });
    expect(result.success).toBe(false);
  });

  it('rejects more than 8 highlights', () => {
    const highlights = Array(9).fill('Highlight point');
    const result = parse({ highlights });
    expect(result.success).toBe(false);
  });

  // ── Email and URL validation ─────────────────────────────────────────────

  it('rejects an invalid bookingEmail format', () => {
    const result = parse({ bookingEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('accepts empty string bookingEmail as "no email" (treated as absent)', () => {
    // Empty string is allowed by the optionalEmail schema
    const result = parse({ bookingEmail: '' });
    // With empty email and no other contact, should fail the "public contact" check
    expect(result.success).toBe(false);
  });

  it('rejects an invalid heroImageUrl', () => {
    const result = parse({ heroImageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts null heroImageUrl', () => {
    const result = parse({ heroImageUrl: null });
    expect(result.success).toBe(true);
  });

  // ── baseLocale ───────────────────────────────────────────────────────────

  it('rejects unsupported baseLocale', () => {
    const result = parse({ baseLocale: 'fr' });
    expect(result.success).toBe(false);
  });

  it('accepts "es" as baseLocale', () => {
    const result = parse({ baseLocale: 'es' });
    expect(result.success).toBe(true);
  });
});

describe('epkFeaturedMediaSchema', () => {
  it('accepts a valid Spotify media item', () => {
    const result = epkFeaturedMediaSchema.safeParse({
      id: 'media-1',
      title: 'My Song',
      url: 'https://open.spotify.com/track/abc',
      provider: 'spotify',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when title is empty', () => {
    const result = epkFeaturedMediaSchema.safeParse({
      id: 'media-1',
      title: '',
      url: 'https://spotify.com/track/1',
      provider: 'spotify',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid provider', () => {
    const result = epkFeaturedMediaSchema.safeParse({
      id: 'media-1',
      title: 'Track',
      url: 'https://example.com',
      provider: 'tiktok',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid providers', () => {
    for (const provider of ['spotify', 'soundcloud', 'youtube', 'other']) {
      const result = epkFeaturedMediaSchema.safeParse({
        id: 'x',
        title: 'T',
        url: 'https://example.com',
        provider,
      });
      expect(result.success, `provider "${provider}" should be valid`).toBe(true);
    }
  });
});

describe('epkFeaturedLinkSchema', () => {
  it('accepts a valid featured link', () => {
    const result = epkFeaturedLinkSchema.safeParse({
      id: 'link-1',
      label: 'My Website',
      url: 'https://myartist.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when label is empty', () => {
    const result = epkFeaturedLinkSchema.safeParse({
      id: 'link-1',
      label: '',
      url: 'https://myartist.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid URL', () => {
    const result = epkFeaturedLinkSchema.safeParse({
      id: 'link-1',
      label: 'Visit',
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});
