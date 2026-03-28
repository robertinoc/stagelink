'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateArtist, type Artist } from '@/lib/api/artists';
import { profileSchema, type ProfileFormValues } from '../schemas/profile.schema';
import { ProfileBasicInfo } from './ProfileBasicInfo';
import { ProfileImagesSection } from './ProfileImagesSection';
import { ProfileSocialLinks } from './ProfileSocialLinks';
import { ProfileSeoSection } from './ProfileSeoSection';

interface ArtistProfileSettingsProps {
  artist: Artist;
  accessToken: string;
}

/**
 * Artist profile editor — orchestrates all profile sections.
 *
 * Architecture:
 * - Form fields (basic info, social links, SEO) are managed by react-hook-form
 *   with zod validation. Saved together on "Save profile".
 * - Images (avatar, cover) are uploaded immediately via the presigned URL
 *   pipeline — they are NOT part of the form submit flow.
 *
 * Artist determination:
 * - The artist is resolved server-side by the page component (via /api/auth/me
 *   → artistIds[0] → GET /api/artists/:id) and passed as a prop.
 * - Multi-artist support: when a user can manage multiple artists, the page
 *   component would pass the selected artist; this component stays the same.
 */
export function ArtistProfileSettings({
  artist: initialArtist,
  accessToken,
}: ArtistProfileSettingsProps) {
  const [artist, setArtist] = useState<Artist>(initialArtist);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: artist.displayName,
      bio: artist.bio ?? '',
      category: artist.category,
      instagramUrl: artist.instagramUrl ?? '',
      tiktokUrl: artist.tiktokUrl ?? '',
      youtubeUrl: artist.youtubeUrl ?? '',
      spotifyUrl: artist.spotifyUrl ?? '',
      soundcloudUrl: artist.soundcloudUrl ?? '',
      websiteUrl: artist.websiteUrl ?? '',
      contactEmail: artist.contactEmail ?? '',
      seoTitle: artist.seoTitle ?? '',
      seoDescription: artist.seoDescription ?? '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;
  const isBusy = isSubmitting || saveStatus === 'saving';

  async function onSubmit(values: ProfileFormValues) {
    setSaveStatus('saving');
    setSaveError(null);

    // Transform empty strings → null so the backend can clear optional fields
    const payload = {
      displayName: values.displayName,
      bio: values.bio || null,
      category: values.category,
      instagramUrl: values.instagramUrl || null,
      tiktokUrl: values.tiktokUrl || null,
      youtubeUrl: values.youtubeUrl || null,
      spotifyUrl: values.spotifyUrl || null,
      soundcloudUrl: values.soundcloudUrl || null,
      websiteUrl: values.websiteUrl || null,
      contactEmail: values.contactEmail || null,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
    };

    try {
      const updated = await updateArtist(artist.id, payload, accessToken);
      setArtist(updated);
      // Reset form with new values so isDirty becomes false
      reset({
        displayName: updated.displayName,
        bio: updated.bio ?? '',
        category: updated.category,
        instagramUrl: updated.instagramUrl ?? '',
        tiktokUrl: updated.tiktokUrl ?? '',
        youtubeUrl: updated.youtubeUrl ?? '',
        spotifyUrl: updated.spotifyUrl ?? '',
        soundcloudUrl: updated.soundcloudUrl ?? '',
        websiteUrl: updated.websiteUrl ?? '',
        contactEmail: updated.contactEmail ?? '',
        seoTitle: updated.seoTitle ?? '',
        seoDescription: updated.seoDescription ?? '',
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save changes. Please try again.',
      );
      setSaveStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6">
        {/* 1 — Images (outside form submit — immediate upload) */}
        <ProfileImagesSection
          artistId={artist.id}
          avatarUrl={artist.avatarUrl}
          coverUrl={artist.coverUrl}
          accessToken={accessToken}
          onAvatarChange={(url) => setArtist((a) => ({ ...a, avatarUrl: url }))}
          onCoverChange={(url) => setArtist((a) => ({ ...a, coverUrl: url }))}
        />

        {/* 2 — Basic info */}
        <ProfileBasicInfo form={form} disabled={isBusy} />

        {/* 3 — Social links */}
        <ProfileSocialLinks form={form} disabled={isBusy} />

        {/* 4 — SEO */}
        <ProfileSeoSection form={form} disabled={isBusy} username={artist.username} />

        {/* Save bar */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'success' && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Profile saved successfully.</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{saveError}</span>
              </>
            )}
            {saveStatus === 'idle' && isDirty && (
              <span className="text-muted-foreground">You have unsaved changes.</span>
            )}
          </div>

          <Button type="submit" disabled={isBusy || !isDirty} className="w-full sm:w-auto">
            {isBusy ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>
    </form>
  );
}
