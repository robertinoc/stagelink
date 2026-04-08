import { z } from 'zod';
import { getEpkPublishReadiness } from '@stagelink/types';

const optionalUrl = z.string().trim().url().or(z.literal('')).nullable().optional();
const optionalEmail = z.string().trim().email().or(z.literal('')).nullable().optional();

export const epkFeaturedMediaSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(120),
  url: z.string().trim().url().max(2048),
  provider: z.enum(['spotify', 'soundcloud', 'youtube', 'other']),
});

export const epkFeaturedLinkSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1).max(100),
  url: z.string().trim().url().max(2048),
});

export const epkFormSchema = z
  .object({
    headline: z.string().trim().max(140).optional().nullable(),
    shortBio: z.string().trim().max(500).optional().nullable(),
    fullBio: z.string().trim().max(5000).optional().nullable(),
    pressQuote: z.string().trim().max(280).optional().nullable(),
    bookingEmail: optionalEmail,
    managementContact: z.string().trim().max(200).optional().nullable(),
    pressContact: z.string().trim().max(200).optional().nullable(),
    heroImageUrl: optionalUrl,
    galleryImageUrls: z.array(z.string().trim().url().max(2048)).max(6),
    featuredMedia: z.array(epkFeaturedMediaSchema).max(6),
    featuredLinks: z.array(epkFeaturedLinkSchema).max(8),
    highlights: z.array(z.string().trim().max(160)).max(8),
    riderInfo: z.string().trim().max(2000).optional().nullable(),
    techRequirements: z.string().trim().max(2000).optional().nullable(),
    location: z.string().trim().max(120).optional().nullable(),
    availabilityNotes: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const readiness = getEpkPublishReadiness(value);

    if (readiness.missing.includes('Headline')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['headline'],
        message: 'Headline is required.',
      });
    }

    if (readiness.missing.includes('Short bio')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['shortBio'],
        message: 'Short bio is required.',
      });
    }

    if (readiness.missing.includes('Full bio')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fullBio'],
        message: 'Full bio is required.',
      });
    }

    if (readiness.missing.includes('Featured media or gallery image')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['featuredMedia'],
        message: 'Add at least one featured media item or gallery image.',
      });
    }

    if (readiness.missing.includes('At least one public contact')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bookingEmail'],
        message: 'Add at least one public contact.',
      });
    }
  });

export type EpkFormValues = z.infer<typeof epkFormSchema>;
