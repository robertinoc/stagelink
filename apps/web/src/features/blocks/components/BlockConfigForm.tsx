'use client';

import { useTranslations } from 'next-intl';
import type {
  BlockType,
  BlockConfig,
  LinksBlockConfig,
  MusicEmbedBlockConfig,
  VideoEmbedBlockConfig,
  EmailCaptureBlockConfig,
} from '@stagelink/types';

interface Props {
  type: BlockType;
  config: BlockConfig;
  onChange: (config: BlockConfig) => void;
}

// ─── Links ────────────────────────────────────────────────────────────────────

function LinksForm({
  config,
  onChange,
}: {
  config: LinksBlockConfig;
  onChange: (c: LinksBlockConfig) => void;
}) {
  const t = useTranslations('blocks.fields');

  const items = config.items ?? [];

  function updateItem(index: number, field: 'label' | 'url', value: string) {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange({ ...config, items: updated });
  }

  function addItem() {
    onChange({ ...config, items: [...items, { label: '', url: '' }] });
  }

  function removeItem(index: number) {
    onChange({ ...config, items: items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Link {index + 1}</span>
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
          <input
            type="text"
            placeholder={t('label')}
            value={item.label}
            onChange={(e) => updateItem(index, 'label', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={100}
          />
          <input
            type="url"
            placeholder="https://..."
            value={item.url}
            onChange={(e) => updateItem(index, 'url', e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={2048}
          />
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
      return { items: [{ label: '', url: '' }] };
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
