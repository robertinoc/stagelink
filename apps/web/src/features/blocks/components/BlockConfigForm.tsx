'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  BlockType,
  BlockConfig,
  BlockLocalizedContent,
  LinksBlockConfig,
  LinkItem,
  LinkIcon,
  LinkItemKind,
  MusicEmbedBlockConfig,
  VideoEmbedBlockConfig,
  EmailCaptureBlockConfig,
  TextBlockConfig,
  TextBlockBioSource,
  ImageGalleryBlockConfig,
  SmartMerchBlockConfig,
  SmartMerchProduct,
  ShopifyStoreBlockConfig,
  ContactFormBlockConfig,
  SupportedLocale,
} from '@stagelink/types';
import { SUPPORTED_LOCALES } from '@stagelink/types';
import { listMerchProducts } from '@/lib/api/merch';
import { SmartLinkPicker } from './SmartLinkForm';

interface Props {
  type: BlockType;
  config: BlockConfig;
  onChange: (config: BlockConfig) => void;
  localizedContent?: BlockLocalizedContent | null;
  onLocalizedContentChange?: (localizedContent: BlockLocalizedContent) => void;
  galleryImages?: string[];
  textSources?: Array<{
    id: string;
    label: string;
    body: string;
  }>;
  /**
   * Required for the smart link picker inside the links block form.
   * When absent, the smart link option is hidden.
   */
  artistId?: string;
}

// ─── Links ────────────────────────────────────────────────────────────────────

/**
 * Human-readable label + emoji for each icon key.
 * Keep in sync with LINK_ICONS in @stagelink/types.
 */
const LINK_ICON_OPTIONS: { value: LinkIcon; label: string }[] = [
  { value: 'spotify', label: '🎵 Spotify' },
  { value: 'apple_music', label: '🎵 Apple Music' },
  { value: 'soundcloud', label: '🔊 SoundCloud' },
  { value: 'youtube', label: '▶️ YouTube' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'tiktok', label: '🎬 TikTok' },
  { value: 'facebook', label: '👥 Facebook' },
  { value: 'x', label: '✕ X (Twitter)' },
  { value: 'website', label: '🌐 Website' },
  { value: 'mail', label: '✉️ Email' },
  { value: 'ticket', label: '🎫 Ticket' },
  { value: 'link', label: '🔗 Link' },
  { value: 'generic', label: '⭐ Generic' },
];

function newLinkItem(sortOrder: number): LinkItem {
  return {
    id: crypto.randomUUID(),
    label: '',
    url: '',
    sortOrder,
    openInNewTab: true,
    kind: 'url',
  };
}

/** Normalise sortOrder to match array index (0..n-1). */
function normaliseSortOrders(items: LinkItem[]): LinkItem[] {
  return items.map((item, i) => ({ ...item, sortOrder: i }));
}

function LinksForm({
  config,
  onChange,
  artistId,
}: {
  config: LinksBlockConfig;
  onChange: (c: LinksBlockConfig) => void;
  artistId?: string;
}) {
  const t = useTranslations('blocks.fields');
  const canUseSmartLinks = !!artistId;

  const items = config.items ?? [];

  function updateItem(index: number, patch: Partial<LinkItem>) {
    const updated = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...config, items: normaliseSortOrders(updated) });
  }

  function addItem() {
    const updated = [...items, newLinkItem(items.length)];
    onChange({ ...config, items: normaliseSortOrders(updated) });
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onChange({ ...config, items: normaliseSortOrders(updated) });
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const updated = [...items];
    const a = updated[index]!;
    const b = updated[swapIndex]!;
    updated[index] = b;
    updated[swapIndex] = a;
    onChange({ ...config, items: normaliseSortOrders(updated) });
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const itemKind: LinkItemKind = item.kind ?? 'url';
        return (
          <div key={item.id} className="space-y-2 rounded-lg border p-3">
            {/* Item header — order controls + remove */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  title={t('move_up')}
                  className="rounded p-0.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  title={t('move_down')}
                  className="rounded p-0.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {t('link_n', { n: index + 1 })}
                </span>
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-destructive hover:underline"
                >
                  {t('remove_link')}
                </button>
              )}
            </div>

            {/* Label */}
            <input
              type="text"
              placeholder={t('label')}
              value={item.label}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={100}
            />

            {/* Kind selector — only shown when smart links are available */}
            {canUseSmartLinks && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateItem(index, { kind: 'url', url: '', smartLinkId: undefined })
                  }
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    itemKind === 'url'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {t('kind_url')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateItem(index, { kind: 'smart_link', url: '', smartLinkId: undefined })
                  }
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    itemKind === 'smart_link'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {t('kind_smart_link')}
                </button>
              </div>
            )}

            {/* URL (for 'url' kind) or SmartLinkPicker (for 'smart_link' kind) */}
            {itemKind === 'smart_link' && artistId ? (
              <SmartLinkPicker
                artistId={artistId}
                selectedId={item.smartLinkId ?? null}
                onSelect={(smartLinkId) => updateItem(index, { smartLinkId, url: '' })}
              />
            ) : (
              <input
                type="url"
                placeholder="https://..."
                value={item.url}
                onChange={(e) => updateItem(index, { url: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                maxLength={2048}
              />
            )}

            {/* Icon + open in new tab — same row */}
            <div className="flex items-center gap-3">
              <select
                value={item.icon ?? ''}
                onChange={(e) =>
                  updateItem(index, {
                    icon: e.target.value ? (e.target.value as LinkIcon) : undefined,
                  })
                }
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('icon_none')}</option>
                {LINK_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={item.openInNewTab ?? true}
                  onChange={(e) => updateItem(index, { openInNewTab: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                {t('open_in_new_tab')}
              </label>
            </div>
          </div>
        );
      })}

      {items.length < 20 && (
        <button
          type="button"
          onClick={addItem}
          className="w-full rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          + {t('add_link')}
        </button>
      )}
    </div>
  );
}

// ─── Music Embed ──────────────────────────────────────────────────────────────

const MUSIC_PROVIDERS = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple_music', label: 'Apple Music' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'youtube', label: 'YouTube' },
] as const;

type MusicHintKey =
  | 'source_url_hint_spotify'
  | 'source_url_hint_apple_music'
  | 'source_url_hint_soundcloud'
  | 'source_url_hint_youtube_music';

const MUSIC_PROVIDER_HINT: Record<MusicEmbedBlockConfig['provider'], MusicHintKey> = {
  spotify: 'source_url_hint_spotify',
  apple_music: 'source_url_hint_apple_music',
  soundcloud: 'source_url_hint_soundcloud',
  youtube: 'source_url_hint_youtube_music',
};

function MusicEmbedForm({
  config,
  onChange,
}: {
  config: MusicEmbedBlockConfig;
  onChange: (c: MusicEmbedBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

  const currentMode = config.mode ?? 'manual';
  const showModeSelector = config.provider === 'soundcloud' || config.provider === 'youtube';

  function handleProviderChange(provider: MusicEmbedBlockConfig['provider']) {
    // Reset sourceUrl and mode when provider changes — old URL won't parse for new provider
    onChange({
      ...config,
      provider,
      sourceUrl: '',
      embedUrl: '',
      resourceType: 'track',
      mode: 'manual',
    });
  }

  function handleModeChange(mode: 'manual' | 'latest_track') {
    // Clear sourceUrl when switching modes — stale data from previous mode shouldn't carry over
    onChange({ ...config, mode, sourceUrl: '', embedUrl: '' });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('provider')}</label>
        <select
          value={config.provider}
          onChange={(e) =>
            handleProviderChange(e.target.value as MusicEmbedBlockConfig['provider'])
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {MUSIC_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mode selector — shown for SoundCloud and YouTube */}
      {showModeSelector && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('source_mode_label')}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('manual')}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                currentMode === 'manual'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {t('source_mode_manual')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (config.provider !== 'soundcloud') {
                  handleModeChange('latest_track');
                }
              }}
              disabled={config.provider === 'soundcloud'}
              title={
                config.provider === 'soundcloud'
                  ? t('source_mode_latest_soundcloud_coming_soon')
                  : undefined
              }
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                currentMode === 'latest_track'
                  ? 'border-primary bg-primary/10 text-primary'
                  : config.provider === 'soundcloud'
                    ? 'cursor-not-allowed border-input text-muted-foreground/40'
                    : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {t('source_mode_latest_track')}
            </button>
          </div>
          {config.provider === 'soundcloud' && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('source_mode_latest_soundcloud_coming_soon')}
            </p>
          )}
        </div>
      )}

      {/* URL input — only shown in manual mode */}
      {currentMode === 'manual' && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('source_url')}</label>
          <input
            type="url"
            placeholder="https://..."
            value={config.sourceUrl}
            onChange={(e) => onChange({ ...config, sourceUrl: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={2048}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t(MUSIC_PROVIDER_HINT[config.provider])}
          </p>
        </div>
      )}

      {/* Latest mode info message */}
      {currentMode === 'latest_track' && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t('source_mode_latest_info_youtube')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Video Embed ──────────────────────────────────────────────────────────────

const VIDEO_PROVIDERS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'tiktok', label: 'TikTok' },
] as const;

type VideoHintKey =
  | 'source_url_hint_youtube_video'
  | 'source_url_hint_vimeo'
  | 'source_url_hint_tiktok';

const VIDEO_PROVIDER_HINT: Record<VideoEmbedBlockConfig['provider'], VideoHintKey> = {
  youtube: 'source_url_hint_youtube_video',
  vimeo: 'source_url_hint_vimeo',
  tiktok: 'source_url_hint_tiktok',
};

function VideoEmbedForm({
  config,
  onChange,
  artistId,
}: {
  config: VideoEmbedBlockConfig;
  onChange: (c: VideoEmbedBlockConfig) => void;
  artistId?: string;
}) {
  const t = useTranslations('blocks.fields');

  const currentMode = config.mode ?? 'manual';
  const showModeSelector = config.provider === 'youtube';

  function handleProviderChange(provider: VideoEmbedBlockConfig['provider']) {
    // Reset sourceUrl and mode when provider changes — old URL won't parse for new provider
    onChange({
      ...config,
      provider,
      sourceUrl: '',
      embedUrl: '',
      resourceType: 'video',
      mode: 'manual',
    });
  }

  function handleModeChange(mode: 'manual' | 'latest_video') {
    // Clear sourceUrl when switching modes — stale data from previous mode shouldn't carry over
    onChange({ ...config, mode, sourceUrl: '', embedUrl: '' });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('provider')}</label>
        <select
          value={config.provider}
          onChange={(e) =>
            handleProviderChange(e.target.value as VideoEmbedBlockConfig['provider'])
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {VIDEO_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mode selector — only for YouTube */}
      {showModeSelector && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('source_mode_label')}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('manual')}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                currentMode === 'manual'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {t('source_mode_manual')}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('latest_video')}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                currentMode === 'latest_video'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {t('source_mode_latest_video')}
            </button>
          </div>
        </div>
      )}

      {/* URL input — shown in manual mode */}
      {currentMode === 'manual' && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('source_url')}</label>
          <input
            type="url"
            placeholder="https://..."
            value={config.sourceUrl}
            onChange={(e) => onChange({ ...config, sourceUrl: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={2048}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {config.provider === 'youtube'
              ? `${t(VIDEO_PROVIDER_HINT[config.provider])} — ${t('source_url_hint_youtube_playlist')}`
              : t(VIDEO_PROVIDER_HINT[config.provider])}
          </p>
        </div>
      )}

      {/* Latest video info message */}
      {currentMode === 'latest_video' && (
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground">{t('source_mode_latest_info_youtube')}</p>
          {!artistId && (
            <p className="mt-1 text-xs text-amber-400">{t('source_mode_latest_no_connection')}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Email Capture ────────────────────────────────────────────────────────────

function EmailCaptureForm({
  config,
  onChange,
}: {
  config: EmailCaptureBlockConfig;
  onChange: (c: EmailCaptureBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('headline')}</label>
        <input
          type="text"
          placeholder={t('headline_placeholder')}
          value={config.headline}
          onChange={(e) => onChange({ ...config, headline: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('button_label')}</label>
        <input
          type="text"
          placeholder={t('button_label_placeholder')}
          value={config.buttonLabel}
          onChange={(e) => onChange({ ...config, buttonLabel: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={50}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('description')}</label>
        <textarea
          value={config.description ?? ''}
          onChange={(e) => onChange({ ...config, description: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
          maxLength={300}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('placeholder_text')}</label>
        <input
          type="text"
          placeholder={t('placeholder_text_placeholder')}
          value={config.placeholder ?? ''}
          onChange={(e) => onChange({ ...config, placeholder: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('success_message')}</label>
        <input
          type="text"
          placeholder={t('success_message_placeholder')}
          value={config.successMessage ?? ''}
          onChange={(e) => onChange({ ...config, successMessage: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={200}
        />
      </div>

      {/* Consent section */}
      <div className="rounded-md border border-input bg-muted/30 p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('consent_section')}
        </p>
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={config.requireConsent ?? false}
            onChange={(e) => onChange({ ...config, requireConsent: e.target.checked || undefined })}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">{t('require_consent')}</span>
        </label>
        {config.requireConsent && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('consent_label')}</label>
            <input
              type="text"
              placeholder={t('consent_label_placeholder')}
              value={config.consentLabel ?? ''}
              onChange={(e) => onChange({ ...config, consentLabel: e.target.value || undefined })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={200}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Text ────────────────────────────────────────────────────────────────────

/** IDs of textSources that represent profile bio fields (handled by the bio selector, not the "Reuse" section). */
const PROFILE_BIO_SOURCE_IDS = ['profile-bio', 'profile-full-bio'] as const;

/** Map from profile source ID to the bioSource value stored in the block config. */
const SOURCE_ID_TO_BIO_SOURCE: Record<string, TextBlockBioSource> = {
  'profile-bio': 'short_bio',
  'profile-full-bio': 'full_bio',
};

function TextBlockForm({
  config,
  onChange,
  textSources,
}: {
  config: TextBlockConfig;
  onChange: (c: TextBlockConfig) => void;
  textSources?: Props['textSources'];
}) {
  const t = useTranslations('blocks.fields');

  // Separate profile bio sources (for the bio selector) from other text sources (for Reuse pills).
  const profileBioSources = (textSources ?? []).filter((s) =>
    (PROFILE_BIO_SOURCE_IDS as readonly string[]).includes(s.id),
  );
  const otherSources = (textSources ?? []).filter(
    (s) => !(PROFILE_BIO_SOURCE_IDS as readonly string[]).includes(s.id),
  );

  // Look up the preview text for the currently selected bioSource.
  const bioSourcePreview = config.bioSource
    ? (profileBioSources.find((s) => SOURCE_ID_TO_BIO_SOURCE[s.id] === config.bioSource)?.body ??
      '')
    : null;

  function selectBioSource(bioSource: TextBlockBioSource) {
    onChange({ ...config, bioSource, body: config.body });
  }

  function clearBioSource() {
    // Remove bioSource by omitting it — spread then delete is safe since TextBlockConfig.bioSource is optional.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bioSource: _omitted, ...rest } = config;
    // Pre-populate body with the current bio preview so the textarea isn't blank
    // when the user switches to "custom text". bioSourcePreview holds the live
    // text that was being displayed (short bio or full bio), giving the user a
    // sensible starting point to edit from.
    const prefilledBody = rest.body || bioSourcePreview || '';
    onChange({ ...rest, body: prefilledBody });
  }

  return (
    <div className="space-y-3">
      {/* ── Bio Selector (profile sources only) ─────────────────────── */}
      {profileBioSources.length > 0 && (
        <div className="rounded-md border border-input bg-muted/20 p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('bio_selector_title')}</p>
            <p className="text-xs text-muted-foreground">{t('bio_selector_hint')}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profileBioSources.map((source) => {
              const bioSource: TextBlockBioSource | undefined = SOURCE_ID_TO_BIO_SOURCE[source.id];
              if (!bioSource) return null;
              const isActive = config.bioSource === bioSource;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => (isActive ? clearBioSource() : selectBioSource(bioSource))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input bg-background text-muted-foreground hover:border-primary hover:text-foreground'
                  }`}
                >
                  {source.label}
                </button>
              );
            })}
            {config.bioSource && (
              <button
                type="button"
                onClick={clearBioSource}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-destructive hover:text-destructive"
              >
                {t('bio_selector_custom')}
              </button>
            )}
          </div>
          {bioSourcePreview !== null && (
            <div className="mt-3 max-h-32 overflow-y-auto rounded-md border border-input bg-background px-3 py-2">
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {bioSourcePreview || t('bio_selector_empty_preview')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Reuse section (non-bio sources) ────────────────────────── */}
      {otherSources.length > 0 ? (
        <div className="rounded-md border border-input bg-muted/20 p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('reuse_section_title')}</p>
            <p className="text-xs text-muted-foreground">{t('reuse_section_hint')}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherSources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => onChange({ ...config, body: source.body })}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                {source.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Custom body textarea (hidden when bioSource is active) ──── */}
      {!config.bioSource && (
        <div>
          <label className="mb-1 block text-sm font-medium">{t('body')}</label>
          <textarea
            value={config.body}
            onChange={(e) => onChange({ ...config, body: e.target.value })}
            placeholder={t('body_placeholder')}
            className="min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={5000}
          />
          <p className="mt-1 text-xs text-muted-foreground">{config.body.length}/5000</p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t('body_locale_hint')}</p>
    </div>
  );
}

function ImageGalleryBlockForm({
  config,
  onChange,
  galleryImages,
}: {
  config: ImageGalleryBlockConfig;
  onChange: (c: ImageGalleryBlockConfig) => void;
  galleryImages?: string[];
}) {
  const t = useTranslations('blocks.fields');
  const availableImages = useMemo(() => galleryImages ?? [], [galleryImages]);
  const selectedImages = useMemo(
    () => config.imageUrls.filter((url) => availableImages.includes(url)),
    [availableImages, config.imageUrls],
  );

  function toggleImage(url: string) {
    const isSelected = selectedImages.includes(url);
    if (isSelected) {
      onChange({
        ...config,
        imageUrls: selectedImages.filter((imageUrl) => imageUrl !== url),
      });
      return;
    }

    if (selectedImages.length >= 6) return;

    onChange({
      ...config,
      imageUrls: [...selectedImages, url],
    });
  }

  function useAllImages() {
    onChange({
      ...config,
      imageUrls: availableImages.slice(0, 6),
    });
  }

  if (availableImages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
        <p className="font-medium text-white">{t('image_gallery_empty')}</p>
        <p className="mt-1">{t('image_gallery_from_profile')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{t('image_gallery_title')}</p>
            <p className="text-xs text-muted-foreground">{t('image_gallery_hint')}</p>
            <p className="text-xs text-muted-foreground">
              {t('image_gallery_selected_count', {
                selected: selectedImages.length,
                total: Math.min(availableImages.length, 6),
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={useAllImages}
            className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
          >
            {t('image_gallery_use_all')}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {availableImages.slice(0, 6).map((url, index) => {
          const selected = selectedImages.includes(url);
          return (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => toggleImage(url)}
              className={`overflow-hidden rounded-2xl border text-left transition ${
                selected
                  ? 'border-primary bg-primary/[0.08] ring-1 ring-primary/50'
                  : 'border-white/10 bg-white/[0.03] hover:border-primary/30'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-40 w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {t('image_gallery_pick_hint', { index: index + 1 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected ? t('image_gallery_selected') : t('image_gallery_select')}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-white/10 bg-white/[0.04] text-muted-foreground'
                  }`}
                >
                  {selected ? t('image_gallery_selected') : t('image_gallery_select')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t('image_gallery_minimum')}</p>
    </div>
  );
}

function ShopifyStoreBlockForm({
  config,
  onChange,
  localizedContent,
  onLocalizedContentChange,
}: {
  config: ShopifyStoreBlockConfig;
  onChange: (c: ShopifyStoreBlockConfig) => void;
  localizedContent?: BlockLocalizedContent | null;
  onLocalizedContentChange?: (localizedContent: BlockLocalizedContent) => void;
}) {
  const t = useTranslations('blocks.fields');
  const currentLocale = useLocale();
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(
    currentLocale === 'es' ? 'es' : 'en',
  );
  const shopifyTranslations = localizedContent?.shopifyStore ?? {};

  function updateLocalizedField(field: 'headline' | 'description' | 'ctaLabel', value: string) {
    if (!onLocalizedContentChange) return;

    const nextLocalizedContent: BlockLocalizedContent = {
      ...(localizedContent ?? {}),
    };
    const nextShopifyStore = {
      ...(nextLocalizedContent.shopifyStore ?? {}),
    };
    const nextFieldTranslations = {
      ...(nextShopifyStore[field] ?? {}),
    };

    if (value.trim()) {
      nextFieldTranslations[activeLocale] = value;
    } else {
      delete nextFieldTranslations[activeLocale];
    }

    if (Object.keys(nextFieldTranslations).length > 0) {
      nextShopifyStore[field] = nextFieldTranslations;
    } else {
      delete nextShopifyStore[field];
    }

    if (Object.keys(nextShopifyStore).length > 0) {
      nextLocalizedContent.shopifyStore = nextShopifyStore;
    } else {
      delete nextLocalizedContent.shopifyStore;
    }

    onLocalizedContentChange(nextLocalizedContent);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('shopify_headline')}</label>
        <input
          type="text"
          placeholder={t('shopify_headline_placeholder')}
          value={config.headline ?? ''}
          onChange={(e) => onChange({ ...config, headline: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('shopify_description')}</label>
        <textarea
          value={config.description ?? ''}
          onChange={(e) => onChange({ ...config, description: e.target.value || undefined })}
          placeholder={t('shopify_description_placeholder')}
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={300}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('shopify_cta_label')}</label>
        <input
          type="text"
          placeholder={t('shopify_cta_label_placeholder')}
          value={config.ctaLabel ?? ''}
          onChange={(e) => onChange({ ...config, ctaLabel: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={40}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('shopify_max_items')}</label>
        <input
          type="number"
          min={1}
          max={8}
          value={config.maxItems ?? 4}
          onChange={(e) =>
            onChange({
              ...config,
              maxItems: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 4,
            })
          }
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('shopify_settings_hint')}</p>
      </div>

      <div className="rounded-md border border-input bg-muted/20 p-3">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">{t('shopify_localized_section')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('shopify_localized_hint')}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LOCALES.map((localeOption) => (
              <button
                key={localeOption}
                type="button"
                onClick={() => setActiveLocale(localeOption)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeLocale === localeOption
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {localeOption === 'en' ? t('shopify_locale_en') : t('shopify_locale_es')}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('shopify_localized_headline')}
            </label>
            <input
              type="text"
              placeholder={t('shopify_headline_placeholder')}
              value={shopifyTranslations.headline?.[activeLocale] ?? ''}
              onChange={(e) => updateLocalizedField('headline', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('shopify_localized_description')}
            </label>
            <textarea
              value={shopifyTranslations.description?.[activeLocale] ?? ''}
              onChange={(e) => updateLocalizedField('description', e.target.value)}
              placeholder={t('shopify_description_placeholder')}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={300}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('shopify_localized_cta')}</label>
            <input
              type="text"
              placeholder={t('shopify_cta_label_placeholder')}
              value={shopifyTranslations.ctaLabel?.[activeLocale] ?? ''}
              onChange={(e) => updateLocalizedField('ctaLabel', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={40}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartMerchBlockForm({
  config,
  onChange,
  localizedContent,
  onLocalizedContentChange,
  artistId,
}: {
  config: SmartMerchBlockConfig;
  onChange: (c: SmartMerchBlockConfig) => void;
  localizedContent?: BlockLocalizedContent | null;
  onLocalizedContentChange?: (localizedContent: BlockLocalizedContent) => void;
  artistId?: string;
}) {
  const t = useTranslations('blocks.fields');
  const currentLocale = useLocale();
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(
    currentLocale === 'es' ? 'es' : 'en',
  );
  const [availableProducts, setAvailableProducts] = useState<SmartMerchProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(Boolean(artistId));
  const [productsError, setProductsError] = useState<string | null>(null);

  const smartMerchTranslations = localizedContent?.smartMerch ?? {};
  const selectedProducts = useMemo(() => config.selectedProducts ?? [], [config.selectedProducts]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!artistId) {
        setAvailableProducts([]);
        setLoadingProducts(false);
        setProductsError(t('smart_merch_products_missing_artist'));
        return;
      }

      setLoadingProducts(true);
      setProductsError(null);

      try {
        const products = await listMerchProducts(artistId, 12);
        if (!cancelled) {
          setAvailableProducts(products);
        }
      } catch (error) {
        if (!cancelled) {
          setProductsError(
            error instanceof Error ? error.message : t('smart_merch_products_error'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [artistId, t]);

  useEffect(() => {
    if (availableProducts.length === 0) return;

    let changed = false;
    const nextSelectedProducts = selectedProducts.map((selection) => {
      if (selection.purchaseUrl.trim()) {
        return selection;
      }

      const product = availableProducts.find((entry) => entry.id === selection.productId);
      if (!product?.productUrl) {
        return selection;
      }

      changed = true;
      return { ...selection, purchaseUrl: product.productUrl };
    });

    if (changed) {
      onChange({ ...config, selectedProducts: nextSelectedProducts });
    }
  }, [availableProducts, config, onChange, selectedProducts]);

  function updateLocalizedField(field: 'headline' | 'subtitle' | 'ctaLabel', value: string) {
    if (!onLocalizedContentChange) return;

    const nextLocalizedContent: BlockLocalizedContent = {
      ...(localizedContent ?? {}),
    };
    const nextSmartMerch = {
      ...(nextLocalizedContent.smartMerch ?? {}),
    };
    const nextFieldTranslations = {
      ...(nextSmartMerch[field] ?? {}),
    };

    if (value.trim()) {
      nextFieldTranslations[activeLocale] = value;
    } else {
      delete nextFieldTranslations[activeLocale];
    }

    if (Object.keys(nextFieldTranslations).length > 0) {
      nextSmartMerch[field] = nextFieldTranslations;
    } else {
      delete nextSmartMerch[field];
    }

    if (Object.keys(nextSmartMerch).length > 0) {
      nextLocalizedContent.smartMerch = nextSmartMerch;
    } else {
      delete nextLocalizedContent.smartMerch;
    }

    onLocalizedContentChange(nextLocalizedContent);
  }

  function toggleProduct(productId: string) {
    const exists = selectedProducts.some((product) => product.productId === productId);
    if (exists) {
      onChange({
        ...config,
        selectedProducts: selectedProducts.filter((product) => product.productId !== productId),
      });
      return;
    }

    if (selectedProducts.length >= 12) {
      return;
    }

    onChange({
      ...config,
      selectedProducts: [
        ...selectedProducts,
        {
          productId,
          purchaseUrl:
            availableProducts.find((product) => product.id === productId)?.productUrl ?? '',
        },
      ],
    });
  }

  function updatePurchaseUrl(productId: string, purchaseUrl: string) {
    onChange({
      ...config,
      selectedProducts: selectedProducts.map((product) =>
        product.productId === productId ? { ...product, purchaseUrl } : product,
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-input bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t('smart_merch_provider')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('smart_merch_provider_hint')}</p>
          </div>
          <span className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium">
            Printful
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('smart_merch_headline')}</label>
        <input
          type="text"
          placeholder={t('smart_merch_headline_placeholder')}
          value={config.headline ?? ''}
          onChange={(e) => onChange({ ...config, headline: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={100}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('smart_merch_subtitle')}</label>
        <textarea
          value={config.subtitle ?? ''}
          onChange={(e) => onChange({ ...config, subtitle: e.target.value || undefined })}
          placeholder={t('smart_merch_subtitle_placeholder')}
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={300}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('smart_merch_cta_label')}</label>
        <input
          type="text"
          placeholder={t('smart_merch_cta_label_placeholder')}
          value={config.ctaLabel ?? ''}
          onChange={(e) => onChange({ ...config, ctaLabel: e.target.value || undefined })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={40}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('smart_merch_display_mode')}</label>
          <div className="flex gap-2">
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ ...config, displayMode: mode })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  (config.displayMode ?? 'grid') === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'grid' ? t('smart_merch_display_grid') : t('smart_merch_display_list')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('smart_merch_max_items')}</label>
          <input
            type="number"
            min={1}
            max={12}
            value={config.maxItems ?? 4}
            onChange={(e) =>
              onChange({
                ...config,
                maxItems: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 4,
              })
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t('smart_merch_settings_hint')}</p>
        </div>
      </div>

      <div className="rounded-md border border-input bg-muted/20 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('smart_merch_purchase_url_required_title')}</p>
          <p className="text-xs text-muted-foreground">
            {t('smart_merch_purchase_url_required_hint')}
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-input bg-muted/20 p-3">
        <div>
          <p className="text-sm font-medium">{t('smart_merch_products_title')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('smart_merch_products_hint')}</p>
        </div>

        {loadingProducts ? (
          <p className="text-sm text-muted-foreground">{t('smart_merch_products_loading')}</p>
        ) : productsError ? (
          <p className="text-sm text-destructive">{productsError}</p>
        ) : availableProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('smart_merch_products_empty')}</p>
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {availableProducts.map((product) => {
              const selectedProduct = selectedProducts.find(
                (entry) => entry.productId === product.id,
              );

              return (
                <div key={product.id} className="rounded-lg border border-input bg-background p-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedProduct)}
                      disabled={!selectedProduct && selectedProducts.length >= 12}
                      onChange={() => toggleProduct(product.id)}
                      className="mt-1 h-4 w-4 rounded border-input"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-3">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="h-14 w-14 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-input text-[10px] uppercase tracking-wide text-muted-foreground">
                            Merch
                          </div>
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium">{product.title}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{product.id}</span>
                            {product.priceAmount ? (
                              <span>
                                {product.priceAmount}
                                {product.currencyCode ? ` ${product.currencyCode}` : ''}
                              </span>
                            ) : null}
                            <span>
                              {product.availableForSale
                                ? t('smart_merch_product_available')
                                : t('smart_merch_product_unavailable')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedProduct ? (
                        <div>
                          <label className="mb-1 block text-xs font-medium">
                            {t('smart_merch_purchase_url')}
                          </label>
                          <input
                            type="url"
                            value={selectedProduct.purchaseUrl}
                            onChange={(event) => updatePurchaseUrl(product.id, event.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {product.productUrl
                              ? t('smart_merch_purchase_url_prefill')
                              : t('smart_merch_purchase_url_missing_provider')}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-md border border-input bg-muted/20 p-3">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">{t('smart_merch_localized_section')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('smart_merch_localized_hint')}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LOCALES.map((localeOption) => (
              <button
                key={localeOption}
                type="button"
                onClick={() => setActiveLocale(localeOption)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeLocale === localeOption
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {localeOption === 'en' ? t('smart_merch_locale_en') : t('smart_merch_locale_es')}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('smart_merch_localized_headline')}
            </label>
            <input
              type="text"
              placeholder={t('smart_merch_headline_placeholder')}
              value={smartMerchTranslations.headline?.[activeLocale] ?? ''}
              onChange={(e) => updateLocalizedField('headline', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('smart_merch_localized_subtitle')}
            </label>
            <textarea
              value={smartMerchTranslations.subtitle?.[activeLocale] ?? ''}
              onChange={(e) => updateLocalizedField('subtitle', e.target.value)}
              placeholder={t('smart_merch_subtitle_placeholder')}
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={300}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('smart_merch_localized_cta')}
            </label>
            <input
              type="text"
              placeholder={t('smart_merch_cta_label_placeholder')}
              value={smartMerchTranslations.ctaLabel?.[activeLocale] ?? ''}
              onChange={(e) => updateLocalizedField('ctaLabel', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={40}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Technical Rider ─────────────────────────────────────────────────────────

function TechnicalRiderForm() {
  const t = useTranslations('blocks.fields');
  return (
    <div className="rounded-md border border-violet-500/20 bg-violet-500/5 p-4">
      <p className="text-sm font-medium text-violet-300">{t('technical_rider_info_title')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('technical_rider_info_body')}</p>
    </div>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactFormFormBlock({
  config,
  onChange,
}: {
  config: ContactFormBlockConfig;
  onChange: (c: ContactFormBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-sm font-medium text-sky-300">{t('contact_form_info_title')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('contact_form_info_body')}</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('contact_form_email_label')}</label>
        <input
          type="email"
          placeholder={t('contact_form_email_placeholder')}
          value={config.email}
          onChange={(e) => onChange({ ...config, email: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={254}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('contact_form_email_hint')}</p>
      </div>
    </div>
  );
}

// ─── Default configs ──────────────────────────────────────────────────────────

export function defaultConfig(type: BlockType): BlockConfig {
  switch (type) {
    case 'links':
      return {
        items: [
          {
            id: crypto.randomUUID(),
            label: '',
            url: '',
            sortOrder: 0,
            openInNewTab: true,
          },
        ],
      };
    case 'music_embed':
      return {
        provider: 'spotify',
        sourceUrl: '',
        embedUrl: '',
        resourceType: 'track',
        mode: 'manual' as const,
      };
    case 'video_embed':
      return {
        provider: 'youtube',
        sourceUrl: '',
        embedUrl: '',
        resourceType: 'video',
        mode: 'manual' as const,
      };
    case 'email_capture':
      return { headline: '', buttonLabel: 'Subscribe' };
    case 'text':
      return { body: '' };
    case 'image_gallery':
      return { imageUrls: [] };
    case 'shopify_store':
      return { headline: '', description: '', ctaLabel: '', maxItems: 4 };
    case 'smart_merch':
      return {
        provider: 'printful',
        headline: '',
        subtitle: '',
        ctaLabel: '',
        displayMode: 'grid',
        sourceMode: 'selected_products',
        selectedProducts: [],
        maxItems: 4,
      };
    case 'technical_rider':
      return { riderInfo: null, techRequirements: null };
    case 'contact_form':
      return { email: '' };
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BlockConfigForm({
  type,
  config,
  onChange,
  localizedContent,
  onLocalizedContentChange,
  galleryImages,
  textSources,
  artistId,
}: Props) {
  switch (type) {
    case 'links':
      return (
        <LinksForm
          config={config as LinksBlockConfig}
          onChange={(c) => onChange(c)}
          artistId={artistId}
        />
      );
    case 'music_embed':
      return (
        <MusicEmbedForm config={config as MusicEmbedBlockConfig} onChange={(c) => onChange(c)} />
      );
    case 'video_embed':
      return (
        <VideoEmbedForm
          config={config as VideoEmbedBlockConfig}
          onChange={(c) => onChange(c)}
          artistId={artistId}
        />
      );
    case 'email_capture':
      return (
        <EmailCaptureForm
          config={config as EmailCaptureBlockConfig}
          onChange={(c) => onChange(c)}
        />
      );
    case 'text':
      return (
        <TextBlockForm
          config={config as TextBlockConfig}
          onChange={(c) => onChange(c)}
          textSources={textSources}
        />
      );
    case 'image_gallery':
      return (
        <ImageGalleryBlockForm
          config={config as ImageGalleryBlockConfig}
          onChange={(c) => onChange(c)}
          galleryImages={galleryImages}
        />
      );
    case 'shopify_store':
      return (
        <ShopifyStoreBlockForm
          config={config as ShopifyStoreBlockConfig}
          onChange={(c) => onChange(c)}
          localizedContent={localizedContent}
          onLocalizedContentChange={onLocalizedContentChange}
        />
      );
    case 'smart_merch':
      return (
        <SmartMerchBlockForm
          config={config as SmartMerchBlockConfig}
          onChange={(c) => onChange(c)}
          localizedContent={localizedContent}
          onLocalizedContentChange={onLocalizedContentChange}
          artistId={artistId}
        />
      );
    case 'technical_rider':
      return <TechnicalRiderForm />;
    case 'contact_form':
      return (
        <ContactFormFormBlock
          config={config as ContactFormBlockConfig}
          onChange={(c) => onChange(c)}
        />
      );
  }
}
