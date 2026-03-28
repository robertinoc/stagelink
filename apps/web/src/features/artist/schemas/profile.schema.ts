import { z } from 'zod';

// ── Reusable refinements ──────────────────────────────────────────────────────

/**
 * Optional URL field: accepts empty string (to clear the value) or a valid
 * absolute URL starting with http:// or https://.
 */
const optionalUrl = z
  .string()
  .refine(
    (val) =>
      val === '' ||
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/.test(
        val,
      ),
    { message: 'Must be a valid URL (https://...)' },
  )
  .optional();

/**
 * Optional email: accepts empty string (to clear) or a valid email address.
 */
const optionalEmail = z
  .string()
  .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Must be a valid email address',
  })
  .optional();

// ── Artist profile form schema ────────────────────────────────────────────────

export const ARTIST_CATEGORIES = [
  'musician',
  'dj',
  'actor',
  'painter',
  'visual_artist',
  'performer',
  'creator',
  'band',
  'producer',
  'other',
] as const;

export const ARTIST_CATEGORY_LABELS: Record<(typeof ARTIST_CATEGORIES)[number], string> = {
  musician: 'Musician',
  dj: 'DJ',
  actor: 'Actor',
  painter: 'Painter',
  visual_artist: 'Visual Artist',
  performer: 'Performer',
  creator: 'Creator',
  band: 'Band',
  producer: 'Producer',
  other: 'Other',
};

export const profileSchema = z.object({
  // Basic info
  displayName: z
    .string()
    .min(1, 'Artist name is required')
    .max(100, 'Artist name must be 100 characters or less'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  category: z.enum(ARTIST_CATEGORIES, { message: 'Please select a category' }),

  // Social links (all optional, empty string = clear)
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  spotifyUrl: optionalUrl,
  soundcloudUrl: optionalUrl,
  websiteUrl: optionalUrl,
  contactEmail: optionalEmail,

  // SEO
  seoTitle: z.string().max(60, 'SEO title must be 60 characters or less').optional(),
  seoDescription: z.string().max(160, 'SEO description must be 160 characters or less').optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
