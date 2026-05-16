'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  ARTIST_RELEASE_TYPES,
  type ArtistRelease,
  type ArtistReleaseType,
  type RecordLabel,
} from '@stagelink/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ── Module-level constants ────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_RELEASE_YEAR = 1980;
/**
 * Year options for the "Year" date-mode dropdown.
 * Newest first so the most likely choice is at the top of the list.
 *   [2026, 2025, 2024, … 1980]
 */
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - EARLIEST_RELEASE_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i,
);

/** Sentinel value for the "Custom…" option in the Label dropdown.
 * Picked so it can never collide with a real label name (`__` prefix is
 * vanishingly rare and the ellipsis is non-ASCII for extra distance). */
const CUSTOM_LABEL_OPTION = '__custom__';

type DateMode = 'year' | 'full';

/**
 * Infer the right date editor mode from a stored release date string.
 * "YYYY-MM-DD" → full picker; "YYYY" or empty → year dropdown.
 * Anything malformed defaults to year mode (the dropdown will just show
 * an empty selection).
 */
function detectDateMode(value: string | null | undefined): DateMode {
  if (!value) return 'year';
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'full' : 'year';
}

/** Compute the initial Label dropdown selection from an existing release.
 * Returns the matching label name when it exists in `recordLabels`, the
 * `CUSTOM_LABEL_OPTION` sentinel when it doesn't, and `''` (the empty
 * "no label" option) when the release has no label set. */
function initialLabelOption(
  initialLabel: string | null | undefined,
  recordLabels: RecordLabel[],
): string {
  if (!initialLabel) return '';
  return recordLabels.some((l) => l.name === initialLabel) ? initialLabel : CUSTOM_LABEL_OPTION;
}

// ── Cover thumbnail ───────────────────────────────────────────────────────────

/**
 * Tiny client component that renders the release cover image, swapping in the
 * 💿 emoji when the URL is missing or fails to load. Same fallback pattern as
 * the EPK `RecordLabelLogo` introduced in PR #336 — and the reason we own a
 * stateful sub-component here rather than just dropping an `<img>` inline.
 */
function ReleaseCoverThumb({ coverUrl, alt }: { coverUrl: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!coverUrl || failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg leading-none"
      >
        💿
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={coverUrl}
      alt={alt}
      className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10 bg-white object-cover"
      onError={() => setFailed(true)}
    />
  );
}

// ── Add / edit modal ──────────────────────────────────────────────────────────

interface ReleaseModalProps {
  open: boolean;
  initial: Omit<ArtistRelease, 'id'> | null;
  /** Artist's record labels — used to populate the Label dropdown.
   * When the artist has none, the modal falls back to a free-text input. */
  recordLabels: RecordLabel[];
  onSave: (data: Omit<ArtistRelease, 'id'>) => void;
  onClose: () => void;
}

function ReleaseModal({ open, initial, recordLabels, onSave, onClose }: ReleaseModalProps) {
  const isEditing = initial !== null;

  // Controlled state for each field. The `<ReleaseModal>` is mounted only when
  // open (see parent), so `useState` initializers always see the correct
  // `initial` — no extra "reset on reopen" logic needed.
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<ArtistReleaseType>(initial?.type ?? 'single');
  const [dateMode, setDateMode] = useState<DateMode>(detectDateMode(initial?.releaseDate));
  const [releaseDate, setReleaseDate] = useState(initial?.releaseDate ?? '');
  // Cover URL is read-only in the UI (upload pipeline not yet implemented).
  // Preserve the existing value when editing so saves don't wipe existing covers.
  const coverUrl = initial?.coverUrl ?? '';
  const [spotifyUrl, setSpotifyUrl] = useState(initial?.spotifyUrl ?? '');
  // Label has TWO controlled bits: the dropdown selection (which can be a
  // record-label name, the empty "no label" option, or the CUSTOM_LABEL_OPTION
  // sentinel) and the freeform value used when the dropdown is on Custom… or
  // when the artist has zero record labels and we render the legacy input.
  const [labelOption, setLabelOption] = useState<string>(
    initialLabelOption(initial?.label, recordLabels),
  );
  const [customLabel, setCustomLabel] = useState(
    initial?.label && !recordLabels.some((l) => l.name === initial.label) ? initial.label : '',
  );
  const [description, setDescription] = useState(initial?.description ?? '');

  const showLabelDropdown = recordLabels.length > 0;

  function handleDateModeChange(next: DateMode) {
    if (next === dateMode) return;
    // Clear the value when switching modes so we never persist a stale
    // half-formed date (e.g. user picks 2024-08-15, switches to Year, the
    // dropdown would otherwise still hold the literal "2024-08-15" string).
    setReleaseDate('');
    setDateMode(next);
  }

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Resolve the final label string from the two-input picker.
    const finalLabel = (() => {
      if (!showLabelDropdown) return customLabel.trim() || null;
      if (labelOption === '') return null;
      if (labelOption === CUSTOM_LABEL_OPTION) return customLabel.trim() || null;
      return labelOption;
    })();

    onSave({
      title: trimmedTitle,
      type,
      releaseDate: releaseDate.trim() || null,
      coverUrl: coverUrl.trim() || null,
      spotifyUrl: spotifyUrl.trim() || null,
      label: finalLabel,
      description: description.trim() || null,
    });
    onClose();
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit release' : 'Add release'}</DialogTitle>
          <DialogDescription>
            Add an EP, album, single, or remix. Cover and Spotify URL are optional.
          </DialogDescription>
        </DialogHeader>

        {/* Cover preview — full width for visibility */}
        <div className="flex items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <ReleaseCoverThumb coverUrl={coverUrl.trim() || null} alt={title || 'Release cover'} />
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {title.trim() || <span className="text-muted-foreground">Release title</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {type}
              {releaseDate.trim() ? ` · ${releaseDate.trim()}` : ''}
            </p>
          </div>
        </div>

        {/* Title — full width because it's the longest field */}
        <div className="space-y-1.5">
          <label htmlFor="release-title" className="text-sm font-medium leading-none">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="release-title"
            placeholder="e.g. Midnight Cycles"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* 2-column grid: Type + Release date. Auto-stacks on mobile. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Type */}
          <div className="space-y-1.5">
            <label htmlFor="release-type" className="text-sm font-medium leading-none">
              Type
            </label>
            <select
              id="release-type"
              value={type}
              onChange={(e) => setType(e.target.value as ArtistReleaseType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ARTIST_RELEASE_TYPES.map((value) => (
                <option key={value} value={value} className="bg-background text-foreground">
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Release date — segmented Year/Full toggle + conditional control */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Release date</label>
            <div className="inline-flex w-full overflow-hidden rounded-md border border-white/20 bg-white/[0.04]">
              <button
                type="button"
                onClick={() => handleDateModeChange('year')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateMode === 'year'
                    ? 'bg-white/20 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Year
              </button>
              <button
                type="button"
                onClick={() => handleDateModeChange('full')}
                className={`flex-1 border-l border-white/20 px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateMode === 'full'
                    ? 'bg-white/20 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Full date
              </button>
            </div>

            {dateMode === 'year' ? (
              <select
                id="release-date-year"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" className="bg-background text-foreground">
                  Select a year…
                </option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={String(year)} className="bg-background text-foreground">
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="release-date-full"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                max={`${CURRENT_YEAR + 1}-12-31`}
                min={`${EARLIEST_RELEASE_YEAR}-01-01`}
              />
            )}
          </div>
        </div>

        {/* Spotify URL — full width (long URLs benefit from the extra space) */}
        <div className="space-y-1.5">
          <label htmlFor="release-spotify" className="text-sm font-medium leading-none">
            Spotify URL (optional)
          </label>
          <Input
            id="release-spotify"
            placeholder="https://open.spotify.com/album/…"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            type="url"
          />
        </div>

        {/* Label — dropdown when the artist has record labels, plain input otherwise */}
        <div className="space-y-1.5">
          <label htmlFor="release-label" className="text-sm font-medium leading-none">
            Label (optional)
          </label>
          {showLabelDropdown ? (
            <>
              <select
                id="release-label"
                value={labelOption}
                onChange={(e) => setLabelOption(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" className="bg-background text-foreground">
                  No label
                </option>
                {recordLabels.map((rl) => (
                  <option key={rl.id} value={rl.name} className="bg-background text-foreground">
                    {rl.name}
                  </option>
                ))}
                <option value={CUSTOM_LABEL_OPTION} className="bg-background text-foreground">
                  Custom…
                </option>
              </select>
              {labelOption === CUSTOM_LABEL_OPTION ? (
                <Input
                  id="release-label-custom"
                  placeholder="Type a custom label"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  maxLength={100}
                />
              ) : null}
              <p className="text-xs text-muted-foreground">
                Pick from your Record labels above, or choose Custom… to type a one-off.
              </p>
            </>
          ) : (
            <>
              <Input
                id="release-label"
                placeholder="e.g. Defected Records"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Add labels to your Record labels card above to reuse them here as a dropdown.
              </p>
            </>
          )}
        </div>

        {/* Description — full width */}
        <div className="space-y-1.5">
          <label htmlFor="release-description" className="text-sm font-medium leading-none">
            Description (optional)
          </label>
          <Textarea
            id="release-description"
            placeholder="A short note about this release…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!title.trim()}>
            {isEditing ? 'Save' : 'Add release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean;
  releaseTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteConfirmDialog({ open, releaseTitle, onConfirm, onClose }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete release?</DialogTitle>
          <DialogDescription>
            &ldquo;{releaseTitle || 'This release'}&rdquo; will be removed from your profile. This
            action only takes effect after you save the form.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

interface ProfileReleasesSectionProps {
  releases: ArtistRelease[];
  /** Artist's record labels — threaded into the modal to populate the Label dropdown. */
  recordLabels: RecordLabel[];
  disabled: boolean;
  onChange: (releases: ArtistRelease[]) => void;
}

export function ProfileReleasesSection({
  releases,
  recordLabels,
  disabled,
  onChange,
}: ProfileReleasesSectionProps) {
  const [modalState, setModalState] = useState<
    { mode: 'add' } | { mode: 'edit'; index: number; initial: Omit<ArtistRelease, 'id'> } | null
  >(null);
  const [deleteState, setDeleteState] = useState<{ index: number; title: string } | null>(null);

  function handleAdd(data: Omit<ArtistRelease, 'id'>) {
    onChange([...releases, { id: crypto.randomUUID(), ...data }]);
  }

  function handleEdit(index: number, data: Omit<ArtistRelease, 'id'>) {
    const next = [...releases];
    next[index] = { ...next[index]!, ...data };
    onChange(next);
  }

  function handleRemove(index: number) {
    onChange(releases.filter((_, i) => i !== index));
  }

  const modalOpen = modalState !== null;
  const modalInitial = modalState?.mode === 'edit' ? modalState.initial : null;

  function handleModalSave(data: Omit<ArtistRelease, 'id'>) {
    if (modalState?.mode === 'add') handleAdd(data);
    else if (modalState?.mode === 'edit') handleEdit(modalState.index, data);
    setModalState(null);
  }

  return (
    <>
      <Card className="border-white/10 bg-white/[0.04] shadow-[0_18px_65px_rgba(10,7,20,0.18)] transition duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-[0_18px_80px_rgba(155,48,208,0.14)]">
        <CardHeader>
          <CardTitle>Releases</CardTitle>
          <CardDescription>
            EPs, albums, singles, remixes — anything you want to show off on your public page.
            Appears below your bio when you have at least one release.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {releases.length > 0 ? (
            <div className="divide-y divide-white/10">
              {releases.map((release, index) => (
                <div key={release.id} className="flex min-h-[56px] items-center gap-4 px-5 py-3">
                  <ReleaseCoverThumb coverUrl={release.coverUrl} alt={release.title} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{release.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {release.type}
                      {release.releaseDate ? ` · ${release.releaseDate}` : ''}
                      {release.label ? ` · ${release.label}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      onClick={() =>
                        setModalState({
                          mode: 'edit',
                          index,
                          initial: {
                            title: release.title,
                            type: release.type,
                            releaseDate: release.releaseDate,
                            coverUrl: release.coverUrl,
                            spotifyUrl: release.spotifyUrl,
                            label: release.label,
                            description: release.description,
                          },
                        })
                      }
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      onClick={() => setDeleteState({ index, title: release.title })}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {releases.length < 50 && !disabled ? (
            <div className={releases.length > 0 ? 'border-t border-white/10 p-4' : 'p-4'}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalState({ mode: 'add' })}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {releases.length === 0 ? 'Add release' : 'Add another'}
              </Button>
            </div>
          ) : null}

          {releases.length === 0 && disabled ? (
            <div className="px-5 py-4">
              <p className="text-sm italic text-muted-foreground/60">No releases added.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Modal mounted only while open — see ProfileRecordLabelsSection.tsx for the
       * full reasoning. tl;dr: useState initializers must see fresh `initial` data
       * each time the modal opens, and Radix's `onOpenChange` is not reliable
       * enough on its own to reset controlled inputs across reopen cycles.
       */}
      {modalOpen ? (
        <ReleaseModal
          open
          initial={modalInitial}
          recordLabels={recordLabels}
          onSave={handleModalSave}
          onClose={() => setModalState(null)}
        />
      ) : null}

      {/* Delete confirmation. Same mount-when-open pattern, same rationale. */}
      {deleteState !== null ? (
        <DeleteConfirmDialog
          open
          releaseTitle={deleteState.title}
          onConfirm={() => handleRemove(deleteState.index)}
          onClose={() => setDeleteState(null)}
        />
      ) : null}
    </>
  );
}
