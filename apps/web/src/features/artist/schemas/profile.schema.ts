import { z } from 'zod';
import type { ArtistRelease, RecordLabel } from '@stagelink/types';

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

const optionalLocalizedText = z.string().max(1000, 'Must be 1000 characters or less').optional();
const optionalLocalizedTitle = z
  .string()
  .max(60, 'SEO title must be 60 characters or less')
  .optional();
const optionalLocalizedDescription = z
  .string()
  .max(160, 'SEO description must be 160 characters or less')
  .optional();
const galleryImageUrlSchema = z
  .string()
  .trim()
  .url('Gallery images must be valid URLs')
  .max(2048, 'Gallery image URLs must be 2048 characters or less');

const optionalLocalizedFullBioText = z
  .string()
  .max(5000, 'Full bio must be 5000 characters or less')
  .optional();

const localizedProfileFieldsSchema = z.object({
  displayName: z.string().max(100, 'Artist name must be 100 characters or less').optional(),
  bio: optionalLocalizedText,
  fullBio: optionalLocalizedFullBioText,
  seoTitle: optionalLocalizedTitle,
  seoDescription: optionalLocalizedDescription,
});

const descriptorSchema = z
  .string()
  .trim()
  .min(1, 'Descriptor cannot be empty')
  .max(24, 'Descriptors must be 24 characters or less');

const supportedLocales = ['en', 'es'] as const;

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

export const profileSchema = z
  .object({
    // Basic info
    displayName: z
      .string()
      .min(1, 'Artist name is required')
      .max(100, 'Artist name must be 100 characters or less'),
    bio: z.string().max(1000, 'Bio must be 1000 characters or less').optional(),
    fullBio: z.string().max(5000, 'Full bio must be 5000 characters or less').optional(),
    baseLocale: z.enum(supportedLocales).default('en'),
    categories: z
      .array(z.enum(ARTIST_CATEGORIES))
      .min(1, 'Choose at least one category')
      .max(3, 'Choose up to 3 categories')
      .default([]),
    tags: z.array(descriptorSchema).max(6, 'Choose up to 6 descriptors').default([]),
    recordLabels: z.array(z.custom<RecordLabel>()).max(10).default([]),
    // REQ-10 — releases / EPs / albums catalog
    releases: z.array(z.custom<ArtistRelease>()).max(50).default([]),
    // REQ-11 — public counters. Nullable: leaving the field empty hides the
    // matching row on the public page. The form maps "" → null on submit.
    epsReleasedCount: z
      .number()
      .int('Must be a whole number')
      .min(0, 'Must be 0 or greater')
      .max(99999, 'Must be 99999 or less')
      .nullable()
      .default(null),
    externalCollabsCount: z
      .number()
      .int('Must be a whole number')
      .min(0, 'Must be 0 or greater')
      .max(99999, 'Must be 99999 or less')
      .nullable()
      .default(null),
    galleryImageUrls: z
      .array(galleryImageUrlSchema)
      .max(6, 'Upload up to 6 gallery images')
      .default([]),

    // Social links (all optional, empty string = clear)
    instagramUrl: optionalUrl,
    tiktokUrl: optionalUrl,
    youtubeUrl: optionalUrl,
    spotifyUrl: optionalUrl,
    soundcloudUrl: optionalUrl,
    websiteUrl: optionalUrl,
    contactEmail: optionalEmail,
    // Streaming platforms (REQ-06)
    appleMusicUrl: optionalUrl,
    amazonMusicUrl: optionalUrl,
    deezerUrl: optionalUrl,
    tidalUrl: optionalUrl,
    // Music stores (REQ-07)
    beatportUrl: optionalUrl,
    traxsourceUrl: optionalUrl,
    // Visibility — keys of links shown on public page ([] = all, legacy mode)
    shownLinks: z.array(z.string()).default([]),

    // SEO
    seoTitle: z.string().max(60, 'SEO title must be 60 characters or less').optional(),
    seoDescription: z
      .string()
      .max(160, 'SEO description must be 160 characters or less')
      .optional(),

    // Additional locales
    translations: z
      .object({
        en: localizedProfileFieldsSchema,
        es: localizedProfileFieldsSchema,
      })
      .default({
        en: {},
        es: {},
      }),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.categories).size !== value.categories.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categories'],
        message: 'Categories must be unique',
      });
    }

    if (new Set(value.tags.map((tag) => tag.toLowerCase())).size !== value.tags.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tags'],
        message: 'Descriptors must be unique',
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
