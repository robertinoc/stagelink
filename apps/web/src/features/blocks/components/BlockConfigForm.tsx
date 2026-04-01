'use client';

import { useTranslations } from 'next-intl';
import type {
  BlockType,
  BlockConfig,
  LinksBlockConfig,
  LinkItem,
  LinkIcon,
  LinkItemKind,
  MusicEmbedBlockConfig,
  VideoEmbedBlockConfig,
  EmailCaptureBlockConfig,
} from '@stagelink/types';
import { LINK_ICONS } from '@stagelink/types';
import { SmartLinkPicker } from './SmartLinkForm';

interface Props {
  type: BlockType;
  config: BlockConfig;
  onChange: (config: BlockConfig) => void;
  /**
   * Required for the smart link picker inside the links block form.
   * When absent, the smart link option is hidden.
   */
  artistId?: string;
  accessToken?: string;
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
  accessToken,
}: {
  config: LinksBlockConfig;
  onChange: (c: LinksBlockConfig) => void;
  artistId?: string;
  accessToken?: string;
}) {
  const t = useTranslations('blocks.fields');
  const canUseSmartLinks = !!(artistId && accessToken);

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
            {itemKind === 'smart_link' && artistId && accessToken ? (
              <SmartLinkPicker
                artistId={artistId}
                accessToken={accessToken}
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

  function handleProviderChange(provider: MusicEmbedBlockConfig['provider']) {
    // Reset sourceUrl when provider changes — old URL won't parse for new provider
    onChange({ ...config, provider, sourceUrl: '', embedUrl: '', resourceType: 'track' });
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
}: {
  config: VideoEmbedBlockConfig;
  onChange: (c: VideoEmbedBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

  function handleProviderChange(provider: VideoEmbedBlockConfig['provider']) {
    // Reset sourceUrl when provider changes — old URL won't parse for new provider
    onChange({ ...config, provider, sourceUrl: '', embedUrl: '', resourceType: 'video' });
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
          {t(VIDEO_PROVIDER_HINT[config.provider])}
        </p>
      </div>
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
      return { provider: 'spotify', sourceUrl: '', embedUrl: '', resourceType: 'track' };
    case 'video_embed':
      return { provider: 'youtube', sourceUrl: '', embedUrl: '', resourceType: 'video' };
    case 'email_capture':
      return { headline: '', buttonLabel: 'Subscribe' };
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BlockConfigForm({ type, config, onChange, artistId, accessToken }: Props) {
  switch (type) {
    case 'links':
      return (
        <LinksForm
          config={config as LinksBlockConfig}
          onChange={(c) => onChange(c)}
          artistId={artistId}
          accessToken={accessToken}
        />
      );
    case 'music_embed':
      return (
        <MusicEmbedForm config={config as MusicEmbedBlockConfig} onChange={(c) => onChange(c)} />
      );
    case 'video_embed':
      return (
        <VideoEmbedForm config={config as VideoEmbedBlockConfig} onChange={(c) => onChange(c)} />
      );
    case 'email_capture':
      return (
        <EmailCaptureForm
          config={config as EmailCaptureBlockConfig}
          onChange={(c) => onChange(c)}
        />
      );
  }
}
