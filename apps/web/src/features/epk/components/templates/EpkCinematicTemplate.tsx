'use client';

// EpkCinematicTemplate — PRO tier.
// Dark cinematic noir: full-bleed hero with gradient overlay, split artist name,
// magenta (#E040FB) accents, sticky dark nav, gallery lightbox.
// Print mode: preserves dark layout with reduced hero height.

import { useState } from 'react';
import type { PublicEpkResponse, SupportedLocale } from '@stagelink/types';
import { EpkLightbox } from '../EpkLightbox';

interface EpkCinematicTemplateProps {
  epk: PublicEpkResponse;
  locale: SupportedLocale;
  printMode?: boolean;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

/** Split artist name at midpoint for stacked hero display */
function splitArtistName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return [words[0] ?? name, ''];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  ink: '#F8F8FF',
  muted: '#A0A0B0',
  accent: '#E040FB',
  accentDim: 'rgba(224,64,251,0.15)',
  accentBorder: 'rgba(224,64,251,0.3)',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function EpkCinematicTemplate({
  epk,
  locale,
  printMode = false,
}: EpkCinematicTemplateProps) {
  const { artist } = epk;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [riderOpen, setRiderOpen] = useState(false);

  // Derived
  let galleryImages = epk.galleryImageUrls.filter(Boolean);
  if (galleryImages[0] === epk.heroImageUrl) galleryImages = galleryImages.slice(1);
  const hasContacts = epk.bookingEmail || epk.managementContact || epk.pressContact || epk.location;
  const hasRider = epk.riderInfo || epk.techRequirements || epk.availabilityNotes;
  const [nameLine1, nameLine2] = splitArtistName(artist.displayName);

  // Labels
  const L = {
    en: {
      hire: 'Hire',
      bio: 'About',
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
      riderHide: 'Hide rider',
      availability: 'Availability',
      artistReq: 'Artist requirements',
      techRider: 'Technical rider',
      recordLabels: 'Record labels',
      printView: 'Print view',
      poweredBy: 'Powered by StageLink',
      pressQuote: 'Press quote',
    },
    es: {
      hire: 'Contratar',
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
      riderShow: 'Ver rider',
      riderHide: 'Ocultar rider',
      availability: 'Disponibilidad',
      artistReq: 'Requerimientos',
      techRider: 'Rider técnico',
      recordLabels: 'Sellos discográficos',
      printView: 'Imprimir',
      poweredBy: 'Powered by StageLink',
      pressQuote: 'Cita de prensa',
    },
  };
  const t = L[locale as keyof typeof L] ?? L.en;

  // ── Print overrides ─────────────────────────────────────────────────────────
  // In print mode we use a cream-white bg to save ink on dark backgrounds.
  const printBg = '#FFFFFF';
  const printInk = '#111111';
  const printMuted = '#555555';
  const printBorder = '#CCCCCC';
  const printSurface = '#F5F5F5';

  const bg = printMode ? printBg : C.bg;
  const ink = printMode ? printInk : C.ink;
  const muted = printMode ? printMuted : C.muted;
  const border = printMode ? printBorder : C.border;
  const surface = printMode ? printSurface : C.surface;
  const accent = printMode ? '#7B00A0' : C.accent;

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
      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      {!printMode && (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(8,8,16,0.9)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            height: 56,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {artist.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.avatarUrl}
                alt={artist.displayName}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: `1px solid rgba(224,64,251,0.4)`,
                }}
              />
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.muted,
              }}
            >
              {artist.displayName}
            </span>
          </div>
          {epk.bookingEmail && (
            <a
              href={`mailto:${epk.bookingEmail}`}
              style={{
                background: `linear-gradient(135deg,${C.accent} 0%,#9B30D0 100%)`,
                color: 'white',
                borderRadius: 24,
                padding: '7px 20px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.04em',
                boxShadow: `0 0 20px rgba(224,64,251,0.3)`,
              }}
            >
              {t.hire}
            </a>
          )}
        </header>
      )}

      {/* ── Hero: full-bleed image + gradient + name ─────────────────────────── */}
      <div style={{ position: 'relative', height: printMode ? 200 : 480, overflow: 'hidden' }}>
        {epk.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={epk.heroImageUrl}
            alt={artist.displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg,#1a0032 0%,#0a0018 100%)`,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(8,8,16,1) 0%, rgba(8,8,16,0.6) 50%, rgba(8,8,16,0.1) 100%)',
          }}
        />

        {/* Artist name */}
        {!printMode && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0 36px 32px',
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                width: 40,
                height: 3,
                background: C.accent,
                marginBottom: 14,
                borderRadius: 2,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(36px, 7vw, 80px)',
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: C.ink,
              }}
            >
              <span style={{ display: 'block' }}>{nameLine1}</span>
              {nameLine2 && (
                <span
                  style={{
                    display: 'block',
                    WebkitTextStroke: `1px ${C.ink}`,
                    color: 'transparent',
                    opacity: 0.85,
                  }}
                >
                  {nameLine2}
                </span>
              )}
            </h1>
            {epk.headline && (
              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: 16,
                  color: 'rgba(248,248,255,0.75)',
                  fontWeight: 300,
                  maxWidth: 540,
                }}
              >
                {epk.headline}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 28px' }}>
        {/* Print-only header */}
        {printMode && (
          <div
            style={{
              padding: '24px 0 20px',
              borderBottom: `2px solid ${accent}`,
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {artist.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.avatarUrl}
                alt={artist.displayName}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: `2px solid ${accent}`,
                }}
              />
            )}
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {artist.displayName}
              </h1>
              {epk.headline && (
                <p style={{ margin: '6px 0 0', fontSize: 15, color: muted }}>{epk.headline}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Bio block ───────────────────────────────────────────────────── */}
        {(epk.shortBio || epk.fullBio) && (
          <section
            style={{
              padding: printMode ? '0 0 32px' : '48px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            {!printMode && <SectionLabel label={t.bio} />}
            {epk.shortBio && (
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: printMode ? 14 : 20,
                  lineHeight: 1.65,
                  color: printMode ? muted : 'rgba(248,248,255,0.8)',
                  fontWeight: printMode ? 400 : 300,
                  fontStyle: printMode ? 'normal' : 'italic',
                  maxWidth: 660,
                }}
              >
                {epk.shortBio}
              </p>
            )}
            {epk.fullBio && epk.fullBio !== epk.shortBio && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.85,
                  color: printMode ? ink : C.muted,
                  whiteSpace: 'pre-line',
                  maxWidth: 700,
                }}
              >
                {epk.fullBio}
              </p>
            )}
          </section>
        )}

        {/* ── Press quote ─────────────────────────────────────────────────── */}
        {epk.pressQuote && (
          <section
            style={{
              padding: printMode ? '24px 0' : '40px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            <blockquote
              style={{
                margin: 0,
                padding: printMode ? '0 0 0 16px' : '0 0 0 24px',
                borderLeft: `3px solid ${accent}`,
                fontSize: printMode ? 14 : 19,
                fontStyle: 'italic',
                lineHeight: 1.65,
                color: printMode ? ink : C.ink,
              }}
            >
              &ldquo;{epk.pressQuote}&rdquo;
            </blockquote>
          </section>
        )}

        {/* ── Highlights ──────────────────────────────────────────────────── */}
        {epk.highlights.length > 0 && (
          <section
            style={{
              padding: printMode ? '24px 0' : '40px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            <SectionLabel label={t.highlights} accent={accent} muted={muted} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {epk.highlights.map((h) => (
                <span
                  key={h}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${printMode ? printBorder : C.accentBorder}`,
                    background: printMode ? printSurface : C.accentDim,
                    borderRadius: printMode ? 6 : 8,
                    fontSize: 13,
                    color: printMode ? ink : C.ink,
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
          <section
            style={{
              padding: printMode ? '24px 0' : '40px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            <SectionLabel label={t.gallery} accent={accent} muted={muted} />
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
                    height: printMode ? 110 : 200,
                    objectFit: 'cover',
                    borderRadius: printMode ? 4 : 0,
                    cursor: printMode ? 'default' : 'zoom-in',
                    display: 'block',
                    filter: printMode ? 'none' : 'brightness(0.92)',
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Featured media ──────────────────────────────────────────────── */}
        {epk.featuredMedia.length > 0 && (
          <section
            style={{
              padding: printMode ? '24px 0' : '40px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            <SectionLabel label={t.music} accent={accent} muted={muted} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                    padding: '14px 18px',
                    border: `1px solid ${border}`,
                    background: surface,
                    textDecoration: 'none',
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
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: accent,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.provider.toUpperCase()}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Links + Contacts ────────────────────────────────────────────── */}
        <section
          style={{
            padding: printMode ? '24px 0' : '40px 0',
            borderBottom: `1px solid ${border}`,
            display: 'grid',
            gridTemplateColumns: hasContacts ? '1fr 280px' : '1fr',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {epk.featuredLinks.length > 0 && (
            <div>
              <SectionLabel label={t.links} accent={accent} muted={muted} />
              {printMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {epk.featuredLinks.map((lnk) => (
                    <div
                      key={lnk.id}
                      style={{ padding: '8px 12px', border: `1px solid ${border}` }}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {epk.featuredLinks.map((lnk) => (
                    <a
                      key={lnk.id}
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '9px 18px',
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        borderRadius: 24,
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.ink,
                        textDecoration: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.accentBorder;
                        e.currentTarget.style.boxShadow = `0 0 20px rgba(224,64,251,0.15)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {lnk.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {hasContacts && (
            <div>
              <SectionLabel label={t.contacts} accent={accent} muted={muted} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                {epk.bookingEmail && (
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                        marginBottom: 2,
                      }}
                    >
                      {t.booking}
                    </span>
                    <a
                      href={`mailto:${epk.bookingEmail}`}
                      style={{ color: ink, textDecoration: 'none' }}
                    >
                      {epk.bookingEmail}
                    </a>
                  </div>
                )}
                {epk.managementContact && (
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                        marginBottom: 2,
                      }}
                    >
                      {t.management}
                    </span>
                    <span>{epk.managementContact}</span>
                  </div>
                )}
                {epk.pressContact && (
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                        marginBottom: 2,
                      }}
                    >
                      {t.press}
                    </span>
                    <span>{epk.pressContact}</span>
                  </div>
                )}
                {epk.location && (
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: muted,
                        marginBottom: 2,
                      }}
                    >
                      {t.base}
                    </span>
                    <span>{epk.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Record labels ───────────────────────────────────────────────── */}
        {epk.recordLabels.length > 0 && (
          <section
            style={{
              padding: printMode ? '24px 0' : '40px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            <SectionLabel label={t.recordLabels} accent={accent} muted={muted} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {epk.recordLabels.map((label) =>
                label.websiteUrl && !printMode ? (
                  <a
                    key={label.id}
                    href={label.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '7px 16px',
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.ink,
                      textDecoration: 'none',
                    }}
                  >
                    {label.name}
                  </a>
                ) : (
                  <span
                    key={label.id}
                    style={{
                      padding: '7px 16px',
                      border: `1px solid ${border}`,
                      background: surface,
                      fontSize: 13,
                      fontWeight: 600,
                      color: ink,
                    }}
                  >
                    {label.name}
                  </span>
                ),
              )}
            </div>
          </section>
        )}

        {/* ── Rider (accordion in digital, flat in print) ──────────────────── */}
        {hasRider && (
          <section
            style={{
              padding: printMode ? '24px 0' : '40px 0',
              borderBottom: `1px solid ${border}`,
            }}
          >
            {printMode ? (
              <>
                <SectionLabel label={t.rider} accent={accent} muted={muted} />
                <RiderContent epk={epk} ink={ink} muted={muted} labels={t} />
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
                    padding: '16px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.muted,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{ display: 'inline-block', width: 20, height: 1, background: accent }}
                    />
                    {t.rider}
                  </span>
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
                  <div style={{ paddingBottom: 16 }}>
                    <RiderContent epk={epk} ink={C.ink} muted={C.muted} labels={t} />
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
              padding: '32px 0 48px',
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
              style={{
                fontSize: 11,
                color: C.muted,
                textDecoration: 'none',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {t.poweredBy}
            </a>
            <a
              href={`/${locale}/${artist.username}/epk/print`}
              style={{ fontSize: 11, color: C.muted, textDecoration: 'none' }}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({
  label,
  accent = C.accent,
  muted = C.muted,
}: {
  label: string;
  accent?: string;
  muted?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span
        style={{ display: 'inline-block', width: 16, height: 2, background: accent, flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: muted,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function RiderContent({
  epk,
  ink,
  muted,
  labels,
}: {
  epk: PublicEpkResponse;
  ink: string;
  muted: string;
  labels: { availability: string; artistReq: string; techRider: string };
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {epk.availabilityNotes && (
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: muted,
            }}
          >
            {labels.availability}
          </p>
          <p
            style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: ink, whiteSpace: 'pre-line' }}
          >
            {epk.availabilityNotes}
          </p>
        </div>
      )}
      {epk.riderInfo && (
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: muted,
            }}
          >
            {labels.artistReq}
          </p>
          <p
            style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: ink, whiteSpace: 'pre-line' }}
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
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: muted,
            }}
          >
            {labels.techRider}
          </p>
          <p
            style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: ink, whiteSpace: 'pre-line' }}
          >
            {epk.techRequirements}
          </p>
        </div>
      )}
    </div>
  );
}
