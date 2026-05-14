'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ARTIST_RELEASE_TYPES, type ArtistRelease, type ArtistReleaseType } from '@stagelink/types';
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
  onSave: (data: Omit<ArtistRelease, 'id'>) => void;
  onClose: () => void;
}

function ReleaseModal({ open, initial, onSave, onClose }: ReleaseModalProps) {
  const isEditing = initial !== null;

  // Controlled state for each field. The `<ReleaseModal>` is mounted only when
  // open (see parent), so `useState` initializers always see the correct
  // `initial` — no extra "reset on reopen" logic needed.
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<ArtistReleaseType>(initial?.type ?? 'single');
  const [releaseDate, setReleaseDate] = useState(initial?.releaseDate ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '');
  const [spotifyUrl, setSpotifyUrl] = useState(initial?.spotifyUrl ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      title: trimmedTitle,
      type,
      releaseDate: releaseDate.trim() || null,
      coverUrl: coverUrl.trim() || null,
      spotifyUrl: spotifyUrl.trim() || null,
      label: label.trim() || null,
      description: description.trim() || null,
    });
    onClose();
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit release' : 'Add release'}</DialogTitle>
          <DialogDescription>
            Add an EP, album, single, or remix. Cover and Spotify URL are optional.
          </DialogDescription>
        </DialogHeader>

        {/* Cover preview */}
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <ReleaseCoverThumb coverUrl={coverUrl.trim() || null} alt={title || 'Release cover'} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {title.trim() || <span className="text-muted-foreground">Release title</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {type}
              {releaseDate.trim() ? ` · ${releaseDate.trim()}` : ''}
            </p>
          </div>
        </div>

        <div className="space-y-4">
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

          <div className="space-y-1.5">
            <label htmlFor="release-date" className="text-sm font-medium leading-none">
              Release date (year or full date)
            </label>
            <Input
              id="release-date"
              placeholder="2024  or  2024-08-15"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">Accepts YYYY or YYYY-MM-DD.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="release-cover" className="text-sm font-medium leading-none">
              Cover URL (optional)
            </label>
            <Input
              id="release-cover"
              placeholder="https://…/cover.jpg"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              type="url"
            />
          </div>

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

          <div className="space-y-1.5">
            <label htmlFor="release-label" className="text-sm font-medium leading-none">
              Label (optional)
            </label>
            <Input
              id="release-label"
              placeholder="e.g. Defected Records"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
            />
          </div>

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
  disabled: boolean;
  onChange: (releases: ArtistRelease[]) => void;
}

export function ProfileReleasesSection({
  releases,
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
