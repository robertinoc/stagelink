'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, X, Check } from 'lucide-react';
import type { EpkAiTone, EpkGenerateBioResponse } from '@stagelink/types';
import { EPK_AI_TONES } from '@stagelink/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateEpkBio } from '@/lib/api/epk';

interface EpkBioGeneratorProps {
  artistId: string;
  /** Pre-populate genre from artist inherited data if available */
  defaultGenre?: string;
  /** Pre-populate from existing EPK highlights */
  existingHighlights?: string[];
  /** Called when the user applies the generated content to the form */
  onApply: (result: EpkGenerateBioResponse) => void;
}

const TONE_LABELS: Record<EpkAiTone, { label: string; description: string }> = {
  professional: { label: 'Professional', description: 'Press-ready, authoritative' },
  casual: { label: 'Casual', description: 'Warm, fan-facing' },
  creative: { label: 'Creative', description: 'Evocative, artistic' },
};

export function EpkBioGenerator({
  artistId,
  defaultGenre = '',
  existingHighlights = [],
  onApply,
}: EpkBioGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [genre, setGenre] = useState(defaultGenre);
  const [influences, setInfluences] = useState('');
  const [tone, setTone] = useState<EpkAiTone>('professional');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EpkGenerateBioResponse | null>(null);
  const [applied, setApplied] = useState(false);

  // Editable preview fields
  const [preview, setPreview] = useState<EpkGenerateBioResponse | null>(null);

  async function handleGenerate() {
    if (!genre.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);
    setPreview(null);
    setApplied(false);

    try {
      const generated = await generateEpkBio(artistId, {
        genre: genre.trim(),
        influences: influences.trim() || undefined,
        highlights: existingHighlights.filter(Boolean),
        tone,
      });
      setResult(generated);
      setPreview(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function handleApply() {
    if (!preview) return;
    onApply(preview);
    setApplied(true);
    setTimeout(() => {
      setOpen(false);
      setResult(null);
      setPreview(null);
      setApplied(false);
    }, 1200);
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setPreview(null);
    setError(null);
    setApplied(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-[linear-gradient(135deg,rgba(168,85,247,0.12),rgba(34,211,238,0.06))] px-4 py-2 text-sm font-medium text-fuchsia-200 transition hover:border-fuchsia-300/40 hover:bg-[linear-gradient(135deg,rgba(168,85,247,0.2),rgba(34,211,238,0.1))] hover:text-white"
      >
        <Sparkles className="h-4 w-4" />
        Generate with AI
      </button>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.07),rgba(34,211,238,0.03))] p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
          <p className="text-sm font-semibold text-white">AI Bio Generator</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Input form */}
      {!result ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80">
              Genre / Style <span className="text-fuchsia-300">*</span>
            </label>
            <Input
              placeholder="e.g. Indie pop, cumbia electrónica, jazz-fusion…"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80">Key influences (optional)</label>
            <Input
              placeholder="e.g. Massive Attack, Bjork, Bomba Estéreo…"
              value={influences}
              onChange={(e) => setInfluences(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/80">Tone</label>
            <div className="flex flex-wrap gap-2">
              {EPK_AI_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                    tone === t
                      ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-white shadow-[0_0_14px_rgba(168,85,247,0.12)]'
                      : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-semibold">{TONE_LABELS[t].label}</span>
                  <span className="text-[11px] opacity-70">{TONE_LABELS[t].description}</span>
                </button>
              ))}
            </div>
          </div>

          {existingHighlights.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              ✓ Your {existingHighlights.length} existing highlight
              {existingHighlights.length > 1 ? 's' : ''} will be included in the prompt.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
          ) : null}

          <Button
            type="button"
            disabled={!genre.trim() || generating}
            onClick={handleGenerate}
            className="gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      ) : null}

      {/* Preview / editable result */}
      {preview ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
            Generated — edit before applying
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">Headline</label>
            <Input
              value={preview.headline}
              onChange={(e) => setPreview({ ...preview, headline: e.target.value })}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {preview.headline.length} / 140
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">Short bio</label>
            <Textarea
              rows={3}
              value={preview.shortBio}
              onChange={(e) => setPreview({ ...preview, shortBio: e.target.value })}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {preview.shortBio.length} / 500
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">Full bio</label>
            <Textarea
              rows={7}
              value={preview.fullBio}
              onChange={(e) => setPreview({ ...preview, fullBio: e.target.value })}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {preview.fullBio.length} / 5000
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">Press quote</label>
            <Textarea
              rows={2}
              value={preview.pressQuote}
              onChange={(e) => setPreview({ ...preview, pressQuote: e.target.value })}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {preview.pressQuote.length} / 280
            </p>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleApply} disabled={applied} className="gap-2">
              {applied ? (
                <>
                  <Check className="h-4 w-4" />
                  Applied!
                </>
              ) : (
                'Apply to form'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={generating}
              onClick={handleGenerate}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Discard
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
