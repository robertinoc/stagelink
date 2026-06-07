'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

interface PhonePreviewFrameProps {
  username: string;
  locale: string;
}

export function PhonePreviewFrame({ username, locale }: PhonePreviewFrameProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Auto-refresh when any block is mutated (created, updated, deleted, reordered).
  // Debounced 1 s so rapid drag-reorder sequences only reload once.
  useEffect(() => {
    function onBlocksChanged() {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setRefreshKey((k) => k + 1);
      }, 1000);
    }
    window.addEventListener('stagelink:blocks-changed', onBlocksChanged);
    return () => {
      window.removeEventListener('stagelink:blocks-changed', onBlocksChanged);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const previewUrl = `/${locale}/${username}`;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
          <span className="font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px] text-white/40">
            Preview · Vivo
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title="Refresh preview"
        >
          <RotateCcw className="h-3 w-3" />
          Actualizar
        </button>
      </div>

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
            key={refreshKey}
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
