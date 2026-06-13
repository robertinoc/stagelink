'use client';

/**
 * useLocaleTranslation — reusable client-side locale-switching hook.
 *
 * Manages translating page/EPK content via the `/api/localization/translate`
 * endpoint, with sessionStorage caching so repeated toggles in the same
 * browser session never re-call OpenAI.
 *
 * Usage:
 *   const { currentContent, activeLocale, translating, switchLocale } =
 *     useLocaleTranslation(initialPage, extractFn, applyFn, {
 *       baseLocale: page.locale,
 *       pageId: page.pageId,
 *     });
 *
 * When the user switches back to the base locale, the original (server-rendered)
 * content is restored instantly — no API call needed.
 */

import { useState, useCallback, useRef } from 'react';
import type { SupportedLocale } from '@stagelink/types';
import { autoTranslateLocalizedFields } from '@/lib/api/localization';

interface UseLocaleTranslationOptions {
  /** The locale the content was originally served in (= what the server rendered). */
  baseLocale: SupportedLocale;
  /** Unique identifier for this page/EPK — used as the sessionStorage cache key. */
  pageId: string;
}

export interface UseLocaleTranslationResult<T> {
  currentContent: T;
  activeLocale: SupportedLocale;
  translating: boolean;
  translateError: string | null;
  switchLocale: (newLocale: SupportedLocale) => Promise<void>;
  dismissError: () => void;
}

const CACHE_PREFIX = 'sl:translation:';

function cacheKey(pageId: string, locale: string): string {
  return `${CACHE_PREFIX}${pageId}:${locale}`;
}

function pushLocaleToUrl(newLocale: string): void {
  try {
    const url = new URL(window.location.href);
    // Replace the leading /xx/ locale segment (always a 2-char ISO code)
    const newPath = url.pathname.replace(/^\/[a-z]{2}\//, `/${newLocale}/`);
    if (newPath !== url.pathname) {
      window.history.pushState(null, '', newPath + url.search + url.hash);
    }
  } catch {
    // URL manipulation failed — safe to ignore
  }
}

export function useLocaleTranslation<T>(
  initialContent: T,
  extractFn: (content: T) => Record<string, string>,
  applyFn: (content: T, translations: Record<string, string>) => T,
  { baseLocale, pageId }: UseLocaleTranslationOptions,
): UseLocaleTranslationResult<T> {
  const [currentContent, setCurrentContent] = useState<T>(initialContent);
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(baseLocale);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Keep the original server-rendered content so we can restore it instantly
  const originalRef = useRef<T>(initialContent);
  // In-process memory cache: locale → translated content
  const memCacheRef = useRef<Partial<Record<string, T>>>({});

  const switchLocale = useCallback(
    async (newLocale: SupportedLocale) => {
      if (newLocale === activeLocale) return;
      setTranslateError(null);

      // ── Switching back to base locale — restore original immediately ──
      if (newLocale === baseLocale) {
        setCurrentContent(originalRef.current);
        setActiveLocale(baseLocale);
        pushLocaleToUrl(baseLocale);
        return;
      }

      // ── In-memory cache hit ───────────────────────────────────────────
      const memHit = memCacheRef.current[newLocale];
      if (memHit) {
        setCurrentContent(memHit);
        setActiveLocale(newLocale);
        pushLocaleToUrl(newLocale);
        return;
      }

      // ── sessionStorage cache hit ──────────────────────────────────────
      try {
        const key = cacheKey(pageId, newLocale);
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, string>;
          const applied = applyFn(originalRef.current, parsed);
          memCacheRef.current[newLocale] = applied;
          setCurrentContent(applied);
          setActiveLocale(newLocale);
          pushLocaleToUrl(newLocale);
          return;
        }
      } catch {
        // sessionStorage unavailable or JSON invalid — fall through to API
      }

      // ── Call the translation API ──────────────────────────────────────
      const extractable = extractFn(originalRef.current);
      if (Object.keys(extractable).length === 0) {
        // Nothing to translate — just switch locale marker + URL
        setActiveLocale(newLocale);
        pushLocaleToUrl(newLocale);
        return;
      }

      setTranslating(true);
      try {
        const translated = await autoTranslateLocalizedFields({
          sourceLocale: baseLocale as 'en' | 'es',
          targetLocale: newLocale as 'en' | 'es',
          values: extractable,
        });

        // Persist to sessionStorage for next toggle
        try {
          sessionStorage.setItem(cacheKey(pageId, newLocale), JSON.stringify(translated));
        } catch {
          // sessionStorage write failed — silent, will re-fetch on next visit
        }

        const applied = applyFn(originalRef.current, translated);
        memCacheRef.current[newLocale] = applied;
        setCurrentContent(applied);
        setActiveLocale(newLocale);
        pushLocaleToUrl(newLocale);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Translation failed';
        setTranslateError(message);
      } finally {
        setTranslating(false);
      }
    },
    [activeLocale, baseLocale, pageId, extractFn, applyFn],
  );

  const dismissError = useCallback(() => setTranslateError(null), []);

  return { currentContent, activeLocale, translating, translateError, switchLocale, dismissError };
}
