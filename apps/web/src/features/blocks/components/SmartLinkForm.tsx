'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { SmartLink, SmartLinkDestination, SmartLinkPlatform } from '@stagelink/types';
import { SMART_LINK_PLATFORMS } from '@stagelink/types';
import {
  getSmartLinks,
  createSmartLink,
  updateSmartLink,
  deleteSmartLink,
} from '@/lib/api/smart-links';

// ─── Platform labels ──────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<SmartLinkPlatform, string> = {
  ios: '🍎 iOS (iPhone / iPad)',
  android: '🤖 Android',
  desktop: '🖥️ Desktop',
  all: '🌐 All platforms (fallback)',
};

// ─── Destination row ──────────────────────────────────────────────────────────

interface DestinationRowProps {
  dest: SmartLinkDestination;
  usedPlatforms: SmartLinkPlatform[];
  onChange: (dest: SmartLinkDestination) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function DestinationRow({
  dest,
  usedPlatforms,
  onChange,
  onRemove,
  canRemove,
}: DestinationRowProps) {
  const t = useTranslations('blocks.smart_link');

  const availablePlatforms = SMART_LINK_PLATFORMS.filter(
    (p) => p === dest.platform || !usedPlatforms.includes(p),
  );

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{t('destination')}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-destructive hover:underline"
          >
            {t('remove_destination')}
          </button>
        )}
      </div>

      {/* Platform */}
      <select
        value={dest.platform}
        onChange={(e) => onChange({ ...dest, platform: e.target.value as SmartLinkPlatform })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {availablePlatforms.map((p) => (
          <option key={p} value={p}>
            {PLATFORM_LABELS[p]}
          </option>
        ))}
      </select>

      {/* URL */}
      <input
        type="url"
        placeholder="https://..."
        value={dest.url}
        onChange={(e) => onChange({ ...dest, url: e.target.value })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        maxLength={2048}
      />

      {/* Optional label */}
      <input
        type="text"
        placeholder={t('destination_label_placeholder')}
        value={dest.label ?? ''}
        onChange={(e) => onChange({ ...dest, label: e.target.value || undefined })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        maxLength={100}
      />
    </div>
  );
}

// ─── Smart link editor ────────────────────────────────────────────────────────

interface SmartLinkEditorProps {
  smartLink: SmartLink | null; // null = creating new
  onSave: (smartLink: SmartLink) => void;
  onCancel: () => void;
  artistId: string;
  accessToken: string;
}

function SmartLinkEditor({
  smartLink,
  onSave,
  onCancel,
  artistId,
  accessToken,
}: SmartLinkEditorProps) {
  const t = useTranslations('blocks.smart_link');
  const [label, setLabel] = useState(smartLink?.label ?? '');
  const [destinations, setDestinations] = useState<SmartLinkDestination[]>(
    smartLink?.destinations && smartLink.destinations.length > 0
      ? smartLink.destinations
      : [{ id: crypto.randomUUID(), platform: 'all', url: '', label: '' }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedPlatforms = destinations.map((d) => d.platform);

  function addDestination() {
    const available = SMART_LINK_PLATFORMS.filter((p) => !usedPlatforms.includes(p));
    if (available.length === 0) return;
    setDestinations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), platform: available[0]!, url: '', label: '' },
    ]);
  }

  function updateDestination(index: number, dest: SmartLinkDestination) {
    setDestinations((prev) => prev.map((d, i) => (i === index ? dest : d)));
  }

  function removeDestination(index: number) {
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError(null);
    if (!label.trim()) {
      setError(t('label_required'));
      return;
    }
    if (destinations.length === 0) {
      setError(t('destinations_required'));
      return;
    }
    const invalid = destinations.find((d) => !d.url.trim());
    if (invalid) {
      setError(t('url_required'));
      return;
    }

    setSaving(true);
    try {
      let result: SmartLink;
      if (smartLink) {
        result = await updateSmartLink(
          smartLink.id,
          { label: label.trim(), destinations },
          accessToken,
        );
      } else {
        result = await createSmartLink(
          artistId,
          { label: label.trim(), destinations: destinations.map(({ id: _id, ...d }) => d) },
          accessToken,
        );
      }
      onSave(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('save_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Internal label */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('label')}</label>
        <input
          type="text"
          placeholder={t('label_placeholder')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          maxLength={100}
        />
      </div>

      {/* Destinations */}
      <div className="space-y-2">
        <span className="text-sm font-medium">{t('destinations')}</span>
        {destinations.map((dest, index) => (
          <DestinationRow
            key={dest.id}
            dest={dest}
            usedPlatforms={usedPlatforms}
            onChange={(d) => updateDestination(index, d)}
            onRemove={() => removeDestination(index)}
            canRemove={destinations.length > 1}
          />
        ))}
        {destinations.length < SMART_LINK_PLATFORMS.length && (
          <button
            type="button"
            onClick={addDestination}
            className="w-full rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + {t('add_destination')}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? t('saving') : t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

// ─── Smart link picker ────────────────────────────────────────────────────────

/**
 * Displayed inside the LinksForm when the user selects kind='smart_link' for a link item.
 *
 * Shows:
 *   - A list of existing SmartLinks (select one)
 *   - An inline editor to create a new SmartLink
 *   - The selected SmartLink's destinations as a summary
 */
export interface SmartLinkPickerProps {
  artistId: string;
  accessToken: string;
  /** Currently selected SmartLink id, or null if nothing selected. */
  selectedId: string | null;
  onSelect: (smartLinkId: string) => void;
}

export function SmartLinkPicker({
  artistId,
  accessToken,
  selectedId,
  onSelect,
}: SmartLinkPickerProps) {
  const t = useTranslations('blocks.smart_link');
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SmartLink | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await getSmartLinks(artistId, accessToken);
      setSmartLinks(list);
    } catch {
      // Silently fail — user will see empty list
    } finally {
      setLoading(false);
    }
  }, [artistId, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSaved(smartLink: SmartLink) {
    setSmartLinks((prev) => {
      const idx = prev.findIndex((s) => s.id === smartLink.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = smartLink;
        return updated;
      }
      return [smartLink, ...prev];
    });
    setCreating(false);
    setEditing(null);
    onSelect(smartLink.id);
  }

  if (creating) {
    return (
      <SmartLinkEditor
        smartLink={null}
        onSave={handleSaved}
        onCancel={() => setCreating(false)}
        artistId={artistId}
        accessToken={accessToken}
      />
    );
  }

  if (editing) {
    return (
      <SmartLinkEditor
        smartLink={editing}
        onSave={handleSaved}
        onCancel={() => setEditing(null)}
        artistId={artistId}
        accessToken={accessToken}
      />
    );
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : smartLinks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('no_smart_links')}</p>
      ) : (
        <div className="space-y-1">
          {smartLinks.map((sl) => (
            <label
              key={sl.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                selectedId === sl.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="smart-link-select"
                value={sl.id}
                checked={selectedId === sl.id}
                onChange={() => onSelect(sl.id)}
                className="h-4 w-4"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{sl.label}</p>
                <p className="text-xs text-muted-foreground">
                  {sl.destinations.map((d) => PLATFORM_LABELS[d.platform]).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setEditing(sl);
                }}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {t('edit')}
              </button>
            </label>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="w-full rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + {t('new_smart_link')}
      </button>
    </div>
  );
}
