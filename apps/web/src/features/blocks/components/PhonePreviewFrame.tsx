'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

interface PhonePreviewFrameProps {
  username: string;
  locale: string;
  /** Increments every time blocks change — used to auto-refresh when live preview is on. */
  blocksVersion?: number;
}

export function PhonePreviewFrame({ username, locale, blocksVersion = 0 }: PhonePreviewFrameProps) {
  const [manualKey, setManualKey] = useState(0);
  const [livePreview, setLivePreview] = useState(false);
  // Track which blocksVersion we've applied so we only re-render on NEW changes
  const [appliedVersion, setAppliedVersion] = useState(blocksVersion);

  useEffect(() => {
    if (livePreview && blocksVersion !== appliedVersion) {
      setAppliedVersion(blocksVersion);
      setManualKey((k) => k + 1);
    }
  }, [livePreview, blocksVersion, appliedVersion]);

  // Refresh preview when the theme changes (ThemeSelector dispatches this event
  // from outside the PageBuilderClient tree, so we can't use blocksVersion).
  useEffect(() => {
    function onThemeChanged() {
      setManualKey((k) => k + 1);
    }
    window.addEventListener('stagelink:themeChanged', onThemeChanged);
    return () => window.removeEventListener('stagelink:themeChanged', onThemeChanged);
  }, []);

  const handleRefresh = useCallback(() => {
    setManualKey((k) => k + 1);
  }, []);

  const iframeKey = manualKey;
  const previewUrl = `/${locale}/${username}`;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${livePreview ? 'animate-pulse bg-[#E040FB]' : 'bg-[#4ade80]'}`}
          />
          <span className="font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px] text-white/40">
            Preview · {livePreview ? 'En vivo' : 'Vivo'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Live preview toggle */}
          <label
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white select-none"
            title="Actualiza el preview automáticamente al guardar cambios. Puede hacer el editor un poco más lento."
          >
            <RefreshCw className={`h-3 w-3 ${livePreview ? 'text-[#E040FB]' : ''}`} />
            <span className={livePreview ? 'text-[#E040FB]' : ''}>Auto</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={livePreview}
              onChange={(e) => setLivePreview(e.target.checked)}
            />
            <span
              className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${livePreview ? 'bg-[#E040FB]' : 'bg-white/20'}`}
            >
              <span
                className={`absolute inline-block h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform ${livePreview ? 'translate-x-[10px]' : 'translate-x-[1px]'}`}
              />
            </span>
          </label>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            title="Actualizar preview"
          >
            <RotateCcw className="h-3 w-3" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Live preview hint */}
      {livePreview && (
        <p className="w-full text-[10px] text-white/30">
          ⚡ El preview se actualiza automáticamente al guardar cambios.
        </p>
      )}

      {/* Phone frame */}
      <div className="relative mx-auto" style={{ width: 280, height: 580 }}>
        {/* Outer shell */}
        <div
          className="absolute inset-0 rounded-[44px]"
          style={{
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
            boxShadow:
              '0 0 0 2px rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        />

        {/* Screen bezel */}
        <div
          className="absolute inset-[10px] overflow-hidden rounded-[36px]"
          style={{ background: '#090411' }}
        >
          {/* Notch */}
          <div
            className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-2xl"
            style={{ background: '#1a1a1a' }}
          />

          {/* Iframe */}
          <iframe
            key={iframeKey}
            src={previewUrl}
            title="Página pública"
            className="absolute inset-0 h-full w-full border-0"
            style={{
              transform: 'scale(0.68)',
              transformOrigin: 'top left',
              width: '147%',
              height: '147%',
            }}
            loading="lazy"
          />
        </div>

        {/* Volume buttons */}
        <div
          className="absolute left-[-3px] top-[88px] h-8 w-[3px] rounded-l-full"
          style={{ background: '#333' }}
        />
        <div
          className="absolute left-[-3px] top-[128px] h-8 w-[3px] rounded-l-full"
          style={{ background: '#333' }}
        />
        {/* Power button */}
        <div
          className="absolute right-[-3px] top-[110px] h-12 w-[3px] rounded-r-full"
          style={{ background: '#333' }}
        />
      </div>
    </div>
  );
}
