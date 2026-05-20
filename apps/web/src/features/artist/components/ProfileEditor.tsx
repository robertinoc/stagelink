'use client';

// ProfileEditor — top-level profile editor orchestrator.
// Replaces ArtistProfileSettings with the 4-tab redesign:
//   Tab 1 — Identidad y galería
//   Tab 2 — Redes y música
//   Tab 3 — Catálogo
//   Tab 4 — SEO & idiomas

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Artist } from '@/lib/api/artists';
import { profileSchema, type ProfileFormValues } from '../schemas/profile.schema';
import { computeCompletion } from '../utils/profileCompletion';
import { useProfileAutosave } from '../hooks/useProfileAutosave';
import { ProfileTabs, type ProfileTabId } from './ProfileTabs';
import { CompletionRing } from './CompletionRing';
import { SaveBar } from './SaveBar';
import { IdentityTab } from './tabs/IdentityTab';
import { SocialTab } from './tabs/SocialTab';
import { CatalogTab } from './tabs/CatalogTab';
import { SeoTab } from './tabs/SeoTab';
import { Icon } from '@/components/sl/Icon';

interface ProfileEditorProps {
  artist: Artist;
  /** Whether the artist's plan includes multi-language pages (SEO tab upsell). */
  hasMultiLanguageAccess: boolean;
  /** Href to the billing/upgrade page. */
  billingHref: string;
}

export function ProfileEditor({
  artist,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasMultiLanguageAccess,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  billingHref,
}: ProfileEditorProps) {
  const t = useTranslations('dashboard.profile');
  const [activeTab, setActiveTab] = useState<ProfileTabId>('identity');

  // Avatar/cover are uploaded immediately via S3 — not part of the form state.
  // We track their latest URLs in local state so the IdentityTab hero updates
  // optimistically after an upload without waiting for a full artist refetch.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(artist.avatarUrl);
  const [coverUrl, setCoverUrl] = useState<string | null>(artist.coverUrl);

  // ── Form ────────────────────────────────────────────────────────────────
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: artist.displayName,
      bio: artist.bio ?? '',
      fullBio: artist.fullBio ?? '',
      baseLocale: artist.baseLocale,
      categories: [artist.category, ...(artist.secondaryCategories ?? [])],
      tags: artist.tags ?? [],
      recordLabels: artist.recordLabels ?? [],
      releases: artist.releases ?? [],
      epsReleasedCount: artist.epsReleasedCount ?? null,
      externalCollabsCount: artist.externalCollabsCount ?? null,
      galleryImageUrls: artist.galleryImageUrls ?? [],
      instagramUrl: artist.instagramUrl ?? '',
      tiktokUrl: artist.tiktokUrl ?? '',
      youtubeUrl: artist.youtubeUrl ?? '',
      spotifyUrl: artist.spotifyUrl ?? '',
      soundcloudUrl: artist.soundcloudUrl ?? '',
      websiteUrl: artist.websiteUrl ?? '',
      contactEmail: artist.contactEmail ?? '',
      appleMusicUrl: artist.appleMusicUrl ?? '',
      amazonMusicUrl: artist.amazonMusicUrl ?? '',
      deezerUrl: artist.deezerUrl ?? '',
      tidalUrl: artist.tidalUrl ?? '',
      beatportUrl: artist.beatportUrl ?? '',
      traxsourceUrl: artist.traxsourceUrl ?? '',
      seoTitle: artist.seoTitle ?? '',
      seoDescription: artist.seoDescription ?? '',
      translations: {
        en: {
          displayName: artist.translations?.displayName?.en ?? '',
          bio: artist.translations?.bio?.en ?? '',
          fullBio: artist.translations?.fullBio?.en ?? '',
          seoTitle: artist.translations?.seoTitle?.en ?? '',
          seoDescription: artist.translations?.seoDescription?.en ?? '',
        },
        es: {
          displayName: artist.translations?.displayName?.es ?? '',
          bio: artist.translations?.bio?.es ?? '',
          fullBio: artist.translations?.fullBio?.es ?? '',
          seoTitle: artist.translations?.seoTitle?.es ?? '',
          seoDescription: artist.translations?.seoDescription?.es ?? '',
        },
      },
    },
  });

  // ── Autosave ─────────────────────────────────────────────────────────────
  const { saveStatus, triggerSave, triggerDiscard } = useProfileAutosave({
    form,
    artistId: artist.id,
  });

  // ── Completion ────────────────────────────────────────────────────────────
  // form.watch() subscribes to all changes → re-renders → recomputes.
  // computeCompletion is pure and cheap — no useMemo needed.
  const completion = computeCompletion(form.watch());

  const isDirty = form.formState.isDirty;
  const isSaving = saveStatus === 'saving';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingBottom: 20,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 26,
              fontWeight: 700,
              color: 'white',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {t('heading_title')}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.45)',
              margin: '5px 0 0',
            }}
          >
            {t('heading_subtitle', { username: artist.username })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <CompletionRing pct={completion.total} />

          <a
            href={`https://stagelink.art/${artist.username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 15px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.90)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <Icon.ExternalLink size={14} />
            {t('view_page')}
          </a>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <ProfileTabs value={activeTab} onChange={setActiveTab} completion={completion} />

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {/*
        All tabs are rendered once and hidden/shown via CSS to preserve scroll
        position and avoid re-mounting expensive DnD trees on tab switch.
        Only the active tab is visible; others have display:none.
      */}
      <div style={{ paddingTop: 20, paddingBottom: 100 }}>
        <div style={{ display: activeTab === 'identity' ? 'block' : 'none' }}>
          <IdentityTab
            form={form}
            artistId={artist.id}
            currentAvatarUrl={avatarUrl}
            currentCoverUrl={coverUrl}
            onAvatarChange={setAvatarUrl}
            onCoverChange={setCoverUrl}
          />
        </div>

        <div style={{ display: activeTab === 'social' ? 'block' : 'none' }}>
          <SocialTab form={form} />
        </div>

        <div style={{ display: activeTab === 'catalog' ? 'block' : 'none' }}>
          <CatalogTab form={form} />
        </div>

        <div style={{ display: activeTab === 'seo' ? 'block' : 'none' }}>
          <SeoTab form={form} handle={artist.username} />
        </div>
      </div>

      {/* ── SaveBar ──────────────────────────────────────────────────────── */}
      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={triggerSave}
        onDiscard={triggerDiscard}
      />
    </div>
  );
}
