'use client';

// EpkStudioTemplate — FREE tier.
// Minimal contemporary editorial: clean whitespace, readable typography,
// system light/dark preference with a manual toggle.
// Sections: sticky header → hero → bio → highlights → gallery (lightbox)
//           → featured media → links → contacts → rider (accordion) → footer

import { useState, useEffect } from 'react';
import type { PublicEpkResponse, SupportedLocale } from '@stagelink/types';
import { EpkShimmerLinks } from '../EpkShimmerLinks';
import { EpkLightbox } from '../EpkLightbox';
import { EpkLocaleSwitcher } from '../EpkLocaleSwitcher';
import { EpkTranslateErrorToast } from '../EpkTranslateErrorToast';
import { useLocaleTranslation } from '@/lib/hooks/useLocaleTranslation';
import { extractTranslatableEpkContent, applyTranslationsToEpk } from '@/lib/epk-translation';

interface EpkStudioTemplateProps {
  epk: PublicEpkResponse;
  locale: SupportedLocale;
  printMode?: boolean;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    spotify: 'Spotify',
    soundcloud: 'SoundCloud',
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    other: '↗',
  };
  return <span>{icons[platform] ?? platform}</span>;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function EpkStudioTemplate({
  epk: initialEpk,
  locale: initialLocale,
  printMode = false,
}: EpkStudioTemplateProps) {
  // ── Client-side auto-translate ─────────────────────────────────────────────
  const {
    currentContent: epk,
    activeLocale: locale,
    translating,
    translateError,
    switchLocale,
    dismissError,
  } = useLocaleTranslation(initialEpk, extractTranslatableEpkContent, applyTranslationsToEpk, {
    baseLocale: initialEpk.contentLocale ?? initialLocale,
    pageId: initialEpk.epkId,
  });

  const { artist } = epk;

  // Dark mode — detect system preference, allow manual toggle
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (printMode) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem('epk-studio-theme');
    setDark(stored ? stored === 'dark' : mq.matches);
    const listener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('epk-studio-theme')) setDark(e.matches);
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [printMode]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('epk-studio-theme', next ? 'dark' : 'light');
  }

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Rider accordion state
  const [riderOpen, setRiderOpen] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  // Skip slot 0 (hero cover) and slot 1 (artist portrait) — those are displayed elsewhere.
  let galleryImages = epk.galleryImageUrls.slice(2).filter(Boolean);
  // strip hero from gallery so it doesn't repeat
  if (galleryImages[0] === epk.heroImageUrl) galleryImages = galleryImages.slice(1);

  const hasContacts = epk.bookingEmail || epk.managementContact || epk.pressContact || epk.location;
  const hasRider = epk.riderInfo || epk.techRequirements || epk.availabilityNotes;

  // ── Tokens ───────────────────────────────────────────────────────────────────
  const d = printMode ? false : dark;
  const bg = d ? '#09090B' : '#FFFFFF';
  const ink = d ? '#FAFAFA' : '#09090B';
  const muted = d ? '#A1A1AA' : '#71717A';
  const surface = d ? '#18181B' : '#F4F4F5';
  const border = d ? '#27272A' : '#E4E4E7';
  const accent = d ? '#FFFFFF' : '#09090B';

  // Labels
  const L = {
    en: {
      pressKit: 'Press Kit',
      hire: 'Book this artist',
      bio: 'Bio',
      highlights: 'Highlights',
      gallery: 'Gallery',
      music: 'Music',
      links: 'Links',
      contacts: 'Contacts',
      booking: 'Booking',
      management: 'Management',
      press: 'Press',
      base: 'Location',
      rider: 'Booking info & rider',
      riderShow: 'Show rider details',
      riderHide: 'Hide rider details',
      availability: 'Availability',
      artistReq: 'Artist requirements',
      techRider: 'Technical rider',
      recordLabels: 'Record labels',
      printView: 'Print view',
      poweredBy: 'Powered by StageLink',
      pressQuote: 'Press quote',
      translateError: 'Could not translate. Try again.',
      translateErrorDismiss: 'Dismiss',
    },
    es: {
      pressKit: 'Press Kit',
      hire: 'Contactar Artista',
      bio: 'Bio',
      highlights: 'Destacados',
      gallery: 'Galería',
      music: 'Música',
      links: 'Links',
      contacts: 'Contacto',
      booking: 'Booking',
      management: 'Management',
      press: 'Prensa',
      base: 'Base',
      rider: 'Booking info & rider',
      riderShow: 'Ver detalles del rider',
      riderHide: 'Ocultar rider',
      availability: 'Disponibilidad',
      artistReq: 'Requerimientos del artista',
      techRider: 'Rider técnico',
      recordLabels: 'Sellos discográficos',
      printView: 'Vista de impresión',
      poweredBy: 'Powered by StageLink',
      pressQuote: 'Cita de prensa',
      translateError: 'No se pudo traducir. Intentá de nuevo.',
      translateErrorDismiss: 'Cerrar',
    },
  };
  const t = L[locale as keyof typeof L] ?? L.en;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: bg,
        color: ink,
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {!printMode && translateError && (
        <EpkTranslateErrorToast
          message={t.translateError}
          dismissLabel={t.translateErrorDismiss}
          onDismiss={dismissError}
        />
      )}
      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      {!printMode && (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: d ? 'rgba(9,9,11,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${border}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {artist.displayName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              aria-label={d ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'none',
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                color: muted,
                cursor: 'pointer',
              }}
            >
              {d ? '☀' : '☾'}
            </button>
            {/* Language toggle */}
            <EpkLocaleSwitcher
              currentLocale={locale}
              username={artist.username}
              theme={d ? 'dark' : 'light'}
              onLocaleChange={switchLocale}
              translating={translating}
            />
            {/* Book CTA */}
            {epk.bookingEmail && (
              <a
                href={`mailto:${epk.bookingEmail}`}
                style={{
                  background: accent,
                  color: bg,
                  borderRadius: 24,
                  padding: '7px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                }}
              >
                {t.hire}
              </a>
            )}
          </div>
        </header>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {epk.heroImageUrl && (
          <div
            style={{
              margin: printMode ? '0 0 32px' : '32px 0',
              overflow: 'hidden',
              borderRadius: printMode ? 0 : 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={epk.heroImageUrl}
              alt={artist.displayName}
              style={{
                width: '100%',
                height: printMode ? 200 : 340,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* ── Identity block ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gap: 32,
            gridTemplateColumns: printMode ? '1fr' : 'minmax(0,1fr) auto',
            alignItems: 'start',
            marginBottom: 48,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              {(epk.galleryImageUrls[1] || artist.avatarUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={epk.galleryImageUrls[1] || artist.avatarUrl || undefined}
                  alt={artist.displayName}
                  style={{
                    width: printMode ? 64 : 96,
                    height: printMode ? 64 : 96,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${border}`,
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <h1
                  style={{
                    fontSize: printMode ? 28 : 38,
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {artist.displayName}
                </h1>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: muted,
                  }}
                >
                  {t.pressKit}
                </p>
              </div>
            </div>
            {epk.headline && (
              <p
                style={{
                  fontSize: printMode ? 16 : 20,
                  lineHeight: 1.5,
                  color: d ? '#D4D4D8' : '#3F3F46',
                  margin: '0 0 12px',
                  fontWeight: 300,
                  maxWidth: 640,
                }}
              >
                {epk.headline}
              </p>
            )}
            {epk.shortBio && (
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: d ? '#A1A1AA' : '#52525B',
                  margin: 0,
                  maxWidth: 640,
                }}
              >
                {epk.shortBio}
              </p>
            )}
          </div>

          {/* Contacts sidebar */}
          {hasContacts && !printMode && (
            <div
              style={{
                minWidth: 200,
                padding: '20px 22px',
                background: surface,
                borderRadius: 14,
                border: `1px solid ${border}`,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: muted,
                }}
              >
                {t.contacts}
              </p>
              {epk.bookingEmail && (
                <p style={{ margin: '0 0 10px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.booking}
                  </span>
                  <a
                    href={`mailto:${epk.bookingEmail}`}
                    style={{ color: ink, textDecoration: 'none', fontWeight: 500 }}
                  >
                    {epk.bookingEmail}
                  </a>
                </p>
              )}
              {epk.managementContact && (
                <p style={{ margin: '0 0 10px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.management}
                  </span>
                  <span style={{ color: ink, fontWeight: 500 }}>{epk.managementContact}</span>
                </p>
              )}
              {epk.pressContact && (
                <p style={{ margin: '0 0 10px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.press}
                  </span>
                  <span style={{ color: ink, fontWeight: 500 }}>{epk.pressContact}</span>
                </p>
              )}
              {epk.location && (
                <p style={{ margin: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.base}
                  </span>
                  <span style={{ color: ink, fontWeight: 500 }}>{epk.location}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Divider util ────────────────────────────────────────────────── */}
        {/* ── Press quote ─────────────────────────────────────────────────── */}
        {epk.pressQuote && (
          <div style={{ margin: '0 0 48px', paddingLeft: 24, borderLeft: `3px solid ${border}` }}>
            <p
              style={{
                margin: 0,
                fontSize: printMode ? 15 : 18,
                lineHeight: 1.65,
                fontStyle: 'italic',
                color: d ? '#D4D4D8' : '#3F3F46',
              }}
            >
              &ldquo;{epk.pressQuote}&rdquo;
            </p>
          </div>
        )}

        {/* ── Full bio ────────────────────────────────────────────────────── */}
        {epk.fullBio && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 16px',
              }}
            >
              {t.bio}
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.85,
                color: d ? '#D4D4D8' : '#3F3F46',
                margin: 0,
                whiteSpace: 'pre-line',
                maxWidth: 700,
              }}
            >
              {epk.fullBio}
            </p>
          </section>
        )}

        {/* ── Highlights ──────────────────────────────────────────────────── */}
        {epk.highlights.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 14px',
              }}
            >
              {t.highlights}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {epk.highlights.map((h) => (
                <span
                  key={h}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: `1px solid ${border}`,
                    background: surface,
                    fontSize: 13,
                    fontWeight: 500,
                    color: ink,
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Gallery ─────────────────────────────────────────────────────── */}
        {galleryImages.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 14px',
              }}
            >
              {t.gallery}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {galleryImages.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`${artist.displayName} ${i + 1}`}
                  onClick={printMode ? undefined : () => setLightboxIndex(i)}
                  style={{
                    width: '100%',
                    height: printMode ? 120 : 180,
                    objectFit: 'cover',
                    borderRadius: 10,
                    cursor: printMode ? 'default' : 'zoom-in',
                    display: 'block',
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Featured media ──────────────────────────────────────────────── */}
        {epk.featuredMedia.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 14px',
              }}
            >
              {t.music}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {epk.featuredMedia.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    textDecoration: 'none',
                    background: surface,
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </span>
                  <span style={{ fontSize: 11, color: muted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <SocialIcon platform={item.provider} />
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Links ───────────────────────────────────────────────────────── */}
        {epk.featuredLinks.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 14px',
              }}
            >
              {t.links}
            </h2>
            {printMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {epk.featuredLinks.map((lnk) => (
                  <div
                    key={lnk.id}
                    style={{ padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 8 }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: ink }}>
                      {lnk.label}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        color: muted,
                        wordBreak: 'break-all',
                      }}
                    >
                      {lnk.url}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EpkShimmerLinks
                links={epk.featuredLinks}
                gap={8}
                pillStyle={{
                  padding: '8px 16px',
                  border: `1px solid ${border}`,
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 500,
                  color: ink,
                  background: surface,
                }}
              />
            )}
          </section>
        )}

        {/* ── Record labels ───────────────────────────────────────────────── */}
        {epk.recordLabels.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 14px',
              }}
            >
              {t.recordLabels}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {epk.recordLabels.map((label) =>
                label.websiteUrl && !printMode ? (
                  <a
                    key={label.id}
                    href={label.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '6px 14px',
                      border: `1px solid ${border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: ink,
                      textDecoration: 'none',
                      background: surface,
                    }}
                  >
                    {label.name}
                  </a>
                ) : (
                  <span
                    key={label.id}
                    style={{
                      padding: '6px 14px',
                      border: `1px solid ${border}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: ink,
                      background: surface,
                    }}
                  >
                    {label.name}
                  </span>
                ),
              )}
            </div>
          </section>
        )}

        {/* ── Contacts (print only — digital shows in sidebar) ────────────── */}
        {hasContacts && printMode && (
          <section style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: muted,
                margin: '0 0 14px',
              }}
            >
              {t.contacts}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {epk.bookingEmail && (
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.booking}
                  </span>
                  <span style={{ fontSize: 13 }}>{epk.bookingEmail}</span>
                </div>
              )}
              {epk.managementContact && (
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.management}
                  </span>
                  <span style={{ fontSize: 13 }}>{epk.managementContact}</span>
                </div>
              )}
              {epk.pressContact && (
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.press}
                  </span>
                  <span style={{ fontSize: 13 }}>{epk.pressContact}</span>
                </div>
              )}
              {epk.location && (
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      display: 'block',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: muted,
                      marginBottom: 2,
                    }}
                  >
                    {t.base}
                  </span>
                  <span style={{ fontSize: 13 }}>{epk.location}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Rider (accordion) ───────────────────────────────────────────── */}
        {hasRider && (
          <section style={{ marginBottom: 48 }}>
            {printMode ? (
              <>
                <h2
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: muted,
                    margin: '0 0 14px',
                  }}
                >
                  {t.rider}
                </h2>
                {epk.availabilityNotes && (
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                      }}
                    >
                      {t.availability}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {epk.availabilityNotes}
                    </p>
                  </div>
                )}
                {epk.riderInfo && (
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                      }}
                    >
                      {t.artistReq}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {epk.riderInfo}
                    </p>
                  </div>
                )}
                {epk.techRequirements && (
                  <div>
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                      }}
                    >
                      {t.techRider}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {epk.techRequirements}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setRiderOpen((o) => !o)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    border: `1px solid ${border}`,
                    borderRadius: riderOpen ? '10px 10px 0 0' : 10,
                    background: surface,
                    cursor: 'pointer',
                    color: ink,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span>{t.rider}</span>
                  <span
                    style={{
                      fontSize: 16,
                      transition: 'transform 0.2s',
                      transform: riderOpen ? 'rotate(180deg)' : 'none',
                    }}
                  >
                    ⌄
                  </span>
                </button>
                {riderOpen && (
                  <div
                    style={{
                      border: `1px solid ${border}`,
                      borderTop: 'none',
                      borderRadius: '0 0 10px 10px',
                      padding: '18px',
                      background: surface,
                    }}
                  >
                    {epk.availabilityNotes && (
                      <div style={{ marginBottom: 16 }}>
                        <p
                          style={{
                            margin: '0 0 6px',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: muted,
                          }}
                        >
                          {t.availability}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: d ? '#D4D4D8' : '#3F3F46',
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {epk.availabilityNotes}
                        </p>
                      </div>
                    )}
                    {epk.riderInfo && (
                      <div style={{ marginBottom: 16 }}>
                        <p
                          style={{
                            margin: '0 0 6px',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: muted,
                          }}
                        >
                          {t.artistReq}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: d ? '#D4D4D8' : '#3F3F46',
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {epk.riderInfo}
                        </p>
                      </div>
                    )}
                    {epk.techRequirements && (
                      <div>
                        <p
                          style={{
                            margin: '0 0 6px',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: muted,
                          }}
                        >
                          {t.techRider}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: d ? '#D4D4D8' : '#3F3F46',
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {epk.techRequirements}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {!printMode && (
          <footer
            style={{
              paddingTop: 24,
              borderTop: `1px solid ${border}`,
              marginTop: 16,
              paddingBottom: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <a
              href="https://stagelink.art"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: muted, textDecoration: 'none' }}
            >
              {t.poweredBy}
            </a>
            <a
              href={`/${locale}/${artist.username}/epk/print`}
              style={{ fontSize: 12, color: muted, textDecoration: 'none' }}
            >
              {t.printView} ↗
            </a>
          </footer>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <EpkLightbox
          images={galleryImages}
          activeIndex={lightboxIndex}
          altBase={artist.displayName}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
