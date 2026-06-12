'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { updatePage } from '@/lib/api/pages';

export type ThemeName = 'noche' | 'aurora' | 'forge' | 'papel';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  bg: string;
  accent: string;
  text: string;
  preview: React.ReactNode;
}

export const THEMES: ThemeConfig[] = [
  {
    name: 'noche',
    label: 'Noche',
    bg: '#090411',
    accent: '#9B30D0',
    text: '#ffffff',
    preview: (
      <div className="flex h-full flex-col gap-1.5 p-3">
        <div className="h-2 w-8 rounded-full bg-violet-400/60" />
        <div className="h-1.5 w-5 rounded-full bg-white/20" />
        <div className="mt-1 h-5 w-full rounded-lg bg-violet-500/30" />
        <div className="h-5 w-full rounded-lg bg-white/[0.06]" />
        <div className="h-5 w-full rounded-lg bg-white/[0.06]" />
      </div>
    ),
  },
  {
    name: 'aurora',
    label: 'Aurora',
    bg: '#050d1a',
    accent: '#00D4FF',
    text: '#ffffff',
    preview: (
      <div className="flex h-full flex-col gap-1.5 p-3">
        <div className="h-2 w-8 rounded-full bg-cyan-400/70" />
        <div className="h-1.5 w-5 rounded-full bg-white/20" />
        <div className="mt-1 h-5 w-full rounded-lg bg-cyan-400/25" />
        <div className="h-5 w-full rounded-lg bg-white/[0.06]" />
        <div className="h-5 w-full rounded-lg bg-white/[0.06]" />
      </div>
    ),
  },
  {
    name: 'forge',
    label: 'Forge',
    bg: '#100800',
    accent: '#FF6422',
    text: '#ffffff',
    preview: (
      <div className="flex h-full flex-col gap-1.5 p-3">
        <div className="h-2 w-8 rounded-full bg-orange-400/70" />
        <div className="h-1.5 w-5 rounded-full bg-white/20" />
        <div className="mt-1 h-5 w-full rounded-lg bg-orange-500/30" />
        <div className="h-5 w-full rounded-lg bg-white/[0.06]" />
        <div className="h-5 w-full rounded-lg bg-white/[0.06]" />
      </div>
    ),
  },
  {
    name: 'papel',
    label: 'Papel',
    bg: '#f5f0e8',
    accent: '#2D4A8C',
    text: '#1a1a1a',
    preview: (
      <div className="flex h-full flex-col gap-1.5 p-3">
        <div className="h-2 w-8 rounded-full bg-blue-800/60" />
        <div className="h-1.5 w-5 rounded-full bg-black/15" />
        <div className="mt-1 h-5 w-full rounded-lg bg-blue-900/20" />
        <div className="h-5 w-full rounded-lg bg-black/[0.06]" />
        <div className="h-5 w-full rounded-lg bg-black/[0.06]" />
      </div>
    ),
  },
];

interface ThemeSelectorProps {
  pageId: string;
  currentTheme?: Record<string, string>;
  onThemeChange?: (name: ThemeName) => void;
}

export function ThemeSelector({ pageId, currentTheme, onThemeChange }: ThemeSelectorProps) {
  const initialTheme = (currentTheme?.name as ThemeName | undefined) ?? 'noche';
  const [selected, setSelected] = useState<ThemeName>(initialTheme);
  const [saving, setSaving] = useState(false);

  async function handleSelect(name: ThemeName) {
    if (name === selected) return;
    setSelected(name);
    onThemeChange?.(name);
    setSaving(true);
    try {
      await updatePage(pageId, { theme: { name } });
      // Notify PhonePreviewFrame (which may be outside this component tree) to refresh
      window.dispatchEvent(new CustomEvent('stagelink:themeChanged'));
    } catch {
      // Silently revert if save fails — non-critical
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3.5 font-[family-name:var(--font-heading)] text-[13px] font-semibold uppercase tracking-[1.5px] text-white/70">
        Tema visual
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {THEMES.map((theme) => {
          const isActive = selected === theme.name;
          return (
            <button
              key={theme.name}
              onClick={() => void handleSelect(theme.name)}
              disabled={saving}
              className="group relative flex flex-col overflow-hidden rounded-[16px] border transition-all focus:outline-none"
              style={{
                background: theme.bg,
                border: isActive ? `2px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 0 20px ${theme.accent}33` : 'none',
              }}
            >
              {/* Preview area */}
              <div className="h-[88px] w-full">{theme.preview}</div>

              {/* Label strip */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{
                  borderTop: `1px solid ${theme.text === '#ffffff' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background:
                    theme.text === '#ffffff' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <span
                  className="font-[family-name:var(--font-heading)] text-[12px] font-bold"
                  style={{
                    color: theme.text === '#ffffff' ? 'rgba(255,255,255,0.80)' : theme.text,
                  }}
                >
                  {theme.label}
                </span>
                {isActive && <Check className="h-3.5 w-3.5" style={{ color: theme.accent }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
