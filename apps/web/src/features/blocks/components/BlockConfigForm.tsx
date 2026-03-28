'use client';

import { useTranslations } from 'next-intl';
import type {
  BlockType,
  BlockConfig,
  LinksBlockConfig,
  LinkItem,
  LinkIcon,
  MusicEmbedBlockConfig,
  VideoEmbedBlockConfig,
  EmailCaptureBlockConfig,
} from '@stagelink/types';
import { LINK_ICONS } from '@stagelink/types';

interface Props {
  type: BlockType;
  config: BlockConfig;
  onChange: (config: BlockConfig) => void;
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
  };
}

/** Normalise sortOrder to match array index (0..n-1). */
function normaliseSortOrders(items: LinkItem[]): LinkItem[] {
  return items.map((item, i) => ({ ...item, sortOrder: i }));
}

function LinksForm({
  config,
  onChange,
}: {
  config: LinksBlockConfig;
  onChange: (c: LinksBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

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
      {items.map((item, index) => (
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

          {/* URL */}
          <input
            type="url"
            placeholder="https://..."
            value={item.url}
            onChange={(e) => updateItem(index, { url: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={2048}
          />

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
      ))}

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

function MusicEmbedForm({
  config,
  onChange,
}: {
  config: MusicEmbedBlockConfig;
  onChange: (c: MusicEmbedBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('provider')}</label>
        <select
          value={config.provider}
          onChange={(e) =>
            onChange({
              ...config,
              provider: e.target.value as MusicEmbedBlockConfig['provider'],
            })
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
        <label className="mb-1 block text-sm font-medium">{t('embed_url')}</label>
        <input
          type="url"
          placeholder="https://open.spotify.com/track/..."
          value={config.embedUrl}
          onChange={(e) => onChange({ ...config, embedUrl: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={2048}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('embed_url_hint')}</p>
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

function VideoEmbedForm({
  config,
  onChange,
}: {
  config: VideoEmbedBlockConfig;
  onChange: (c: VideoEmbedBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('provider')}</label>
        <select
          value={config.provider}
          onChange={(e) =>
            onChange({
              ...config,
              provider: e.target.value as VideoEmbedBlockConfig['provider'],
            })
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
        <label className="mb-1 block text-sm font-medium">{t('embed_url')}</label>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={config.embedUrl}
          onChange={(e) => onChange({ ...config, embedUrl: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={2048}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('embed_url_hint')}</p>
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
      return { provider: 'spotify', embedUrl: '' };
    case 'video_embed':
      return { provider: 'youtube', embedUrl: '' };
    case 'email_capture':
      return { headline: '', buttonLabel: 'Subscribe' };
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BlockConfigForm({ type, config, onChange }: Props) {
  switch (type) {
    case 'links':
      return <LinksForm config={config as LinksBlockConfig} onChange={(c) => onChange(c)} />;
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
