'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardShareStripProps {
  username: string;
}

export function DashboardShareStrip({ username }: DashboardShareStripProps) {
  const t = useTranslations('dashboard.home');
  const [copied, setCopied] = useState(false);
  const url = `stagelink.art/${username}`;
  const fullUrl = `https://stagelink.art/${username}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      setCopied(false);
    }
  }

  return (
    <div
      className="sl-sharestrip flex items-center gap-1.5 rounded-full border border-white/8 p-[5px]"
      style={{ background: 'var(--sl-bg-panel)' }}
    >
      {/* URL display */}
      <div className="sl-sharestrip-url flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-3.5 py-1.5 font-[family-name:var(--font-heading)] text-[13px] tracking-[0.3px]">
        <span className="text-white/50">stagelink.art/</span>
        <span className="font-semibold text-white">{username}</span>
      </div>

      {/* Copy / Share button */}
      <button
        onClick={handleCopy}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border-none px-4 py-[9px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.97]"
        style={{
          background: 'var(--sl-grad)',
          boxShadow: '0 0 28px rgba(224,64,251,0.25)',
        }}
        aria-label={copied ? t('share_strip.copied') : t('share_strip.copy')}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? t('share_strip.copied') : t('share_strip.share')}
      </button>
    </div>
  );
}
