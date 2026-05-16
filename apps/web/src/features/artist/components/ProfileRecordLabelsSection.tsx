'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, Building2 } from 'lucide-react';
import type { RecordLabel } from '@stagelink/types';
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

// ── Logo helpers ──────────────────────────────────────────────────────────────

/** Returns a Clearbit logo URL for a given website URL, or null if the URL is invalid. */
function getClearbitLogoUrl(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl) return null;
  try {
    const { hostname } = new URL(websiteUrl);
    return `https://logo.clearbit.com/${hostname}`;
  } catch {
    return null;
  }
}

/** Returns the effective logo URL: explicit logoUrl > Clearbit from websiteUrl > null. */
function effectiveLogoUrl(label: Pick<RecordLabel, 'logoUrl' | 'websiteUrl'>): string | null {
  if (label.logoUrl) return label.logoUrl;
  return getClearbitLogoUrl(label.websiteUrl);
}

// ── Label logo avatar ────────────────────────────────────────────────────────

function LabelLogo({
  logoUrl,
  name,
  size = 'md',
}: {
  logoUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-10 w-10';

  if (!logoUrl || failed) {
    return (
      <div
        className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5`}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      className={`${sizeClass} flex-shrink-0 rounded-lg border border-white/10 bg-white object-contain p-1`}
      onError={() => setFailed(true)}
    />
  );
}

// ── Edit / Add modal ──────────────────────────────────────────────────────────

interface LabelModalProps {
  open: boolean;
  initial: Omit<RecordLabel, 'id'> | null;
  onSave: (data: Omit<RecordLabel, 'id'>) => void;
  onClose: () => void;
}

function LabelModal({ open, initial, onSave, onClose }: LabelModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(initial?.websiteUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? '');

  // Reset state when the modal opens with new data
  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setName(initial?.name ?? '');
      setWebsiteUrl(initial?.websiteUrl ?? '');
      setLogoUrl(initial?.logoUrl ?? '');
    } else {
      onClose();
    }
  }

  // Live logo preview: explicit logoUrl > Clearbit from websiteUrl
  const previewLogo = logoUrl.trim() || getClearbitLogoUrl(websiteUrl.trim());

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave({
      name: trimmedName,
      websiteUrl: websiteUrl.trim() || null,
      logoUrl: logoUrl.trim() || null,
    });
    onClose();
  }

  const isEditing = initial !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit record label' : 'Add record label'}</DialogTitle>
          <DialogDescription>
            Add the name and optionally a website. The logo is fetched automatically from the
            website — or paste a direct logo URL.
          </DialogDescription>
        </DialogHeader>

        {/* Logo preview */}
        <div className="flex items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <LabelLogo logoUrl={previewLogo} name={name || 'Label'} size="lg" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {name.trim() || <span className="text-muted-foreground">Label name</span>}
            </p>
            {websiteUrl.trim() ? (
              <p className="truncate text-xs text-muted-foreground">{websiteUrl.trim()}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground/50">No website set</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="label-name" className="text-sm font-medium leading-none">
              Label name <span className="text-destructive">*</span>
            </label>
            <Input
              id="label-name"
              placeholder="Warner Music, Defected Records…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="label-website" className="text-sm font-medium leading-none">
              Website URL (optional)
            </label>
            <Input
              id="label-website"
              placeholder="https://warnermusicgroup.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Used to auto-fetch the logo via Clearbit.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="label-logo" className="text-sm font-medium leading-none">
              Logo URL (optional override)
            </label>
            <Input
              id="label-logo"
              placeholder="https://…/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Paste a direct image URL to override the auto-fetched logo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? 'Save' : 'Add label'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

interface ProfileRecordLabelsSectionProps {
  labels: RecordLabel[];
  disabled: boolean;
  onChange: (labels: RecordLabel[]) => void;
}

export function ProfileRecordLabelsSection({
  labels,
  disabled,
  onChange,
}: ProfileRecordLabelsSectionProps) {
  const [modalState, setModalState] = useState<
    { mode: 'add' } | { mode: 'edit'; index: number; initial: Omit<RecordLabel, 'id'> } | null
  >(null);
  // Delete confirmation dialog state. Trash click sets this; the dialog only
  // calls `handleRemove` after the user explicitly confirms.
  const [deleteState, setDeleteState] = useState<{ index: number; name: string } | null>(null);

  function handleAdd(data: Omit<RecordLabel, 'id'>) {
    onChange([...labels, { id: crypto.randomUUID(), ...data }]);
  }

  function handleEdit(index: number, data: Omit<RecordLabel, 'id'>) {
    const next = [...labels];
    next[index] = { ...next[index]!, ...data };
    onChange(next);
  }

  function handleRemove(index: number) {
    onChange(labels.filter((_, i) => i !== index));
  }

  const modalOpen = modalState !== null;
  const modalInitial = modalState?.mode === 'edit' ? modalState.initial : null;

  function handleModalSave(data: Omit<RecordLabel, 'id'>) {
    if (modalState?.mode === 'add') handleAdd(data);
    else if (modalState?.mode === 'edit') handleEdit(modalState.index, data);
    setModalState(null);
  }

  return (
    <>
      <Card className="border-white/10 bg-white/[0.04] shadow-[0_18px_65px_rgba(10,7,20,0.18)] transition duration-200 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-[0_18px_80px_rgba(155,48,208,0.14)]">
        <CardHeader>
          <CardTitle>Record labels</CardTitle>
          <CardDescription>
            Labels, publishers, or imprints you&apos;re signed to or have released through. Appears
            in your Press Kit (EPK).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {labels.length > 0 ? (
            <div className="divide-y divide-white/10">
              {labels.map((label, index) => (
                <div key={label.id} className="flex min-h-[56px] items-center gap-4 px-5 py-3">
                  <LabelLogo logoUrl={effectiveLogoUrl(label)} name={label.name} size="sm" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-white">{label.name}</p>
                    {label.websiteUrl ? (
                      <p className="truncate text-xs text-muted-foreground">{label.websiteUrl}</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground/50">No website</p>
                    )}
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
                            name: label.name,
                            websiteUrl: label.websiteUrl,
                            logoUrl: label.logoUrl,
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
                      onClick={() => setDeleteState({ index, name: label.name })}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {labels.length < 10 && !disabled ? (
            <div className={labels.length > 0 ? 'border-t border-white/10 p-4' : 'p-4'}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalState({ mode: 'add' })}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {labels.length === 0 ? 'Add record label' : 'Add another'}
              </Button>
            </div>
          ) : null}

          {labels.length === 0 && disabled ? (
            <div className="px-5 py-4">
              <p className="text-sm italic text-muted-foreground/60">No record labels added.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/*
       * Mount the modal only while open. `useState` initializers in LabelModal
       * run on mount, so unmounting/remounting guarantees that "Add another"
       * after a previous save starts with empty fields instead of leaking the
       * last saved label's data. (Without this, the modal stayed mounted and
       * the controlled <Input> state from the previous "Add" survived across
       * close→reopen cycles.)
       */}
      {modalOpen ? (
        <LabelModal
          open
          initial={modalInitial}
          onSave={handleModalSave}
          onClose={() => setModalState(null)}
        />
      ) : null}

      {/* Delete-confirmation dialog. Mounted only while a row's trash icon was
       * clicked — same mount-when-open pattern as the LabelModal above. */}
      {deleteState !== null ? (
        <Dialog open onOpenChange={(isOpen) => !isOpen && setDeleteState(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete record label?</DialogTitle>
              <DialogDescription>
                &ldquo;{deleteState.name || 'This label'}&rdquo; will be removed from your profile.
                This action only takes effect after you save the form.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteState(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleRemove(deleteState.index);
                  setDeleteState(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
