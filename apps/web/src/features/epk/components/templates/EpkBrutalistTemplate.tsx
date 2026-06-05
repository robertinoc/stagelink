'use client';

// EpkBrutalistTemplate — PRO+ tier. Press Bureau aesthetic.
// Bold editorial grid, no border-radius, brand CSS vars, marquee ticker,
// hard-edge typographic hierarchy.
// Brand palette: --epk-primary, --epk-secondary, --epk-bg, --epk-ink.

import { useState } from 'react';
import type { EpkBrand, PublicEpkResponse, SupportedLocale } from '@stagelink/types';
import { EpkLightbox } from '../EpkLightbox';
import { EpkLocaleSwitcher } from '../EpkLocaleSwitcher';

interface EpkBrutalistTemplateProps {
  epk: PublicEpkResponse;
  locale: SupportedLocale;
  printMode?: boolean;
}

// ── Brand helpers ─────────────────────────────────────────────────────────────

const DEFAULT_BRAND: EpkBrand = {
  primary: '#E040FB',
  secondary: '#9B30D0',
  bg: '#0D0018',
  ink: '#FFFFFF',
};

function mergeBrand(brand: EpkBrand | null): EpkBrand {
  if (!brand) return DEFAULT_BRAND;
  return {
    primary: brand.primary || DEFAULT_BRAND.primary,
    secondary: brand.secondary || DEFAULT_BRAND.secondary,
    bg: brand.bg || DEFAULT_BRAND.bg,
    ink: brand.ink || DEFAULT_BRAND.ink,
  };
}

/** Inject brand palette as CSS vars on the root element */
function buildCssVars(b: EpkBrand): React.CSSProperties {
  return {
    '--epk-primary': b.primary,
    '--epk-secondary': b.secondary,
    '--epk-bg': b.bg,
    '--epk-ink': b.ink,
  } as React.CSSProperties;
}

/** Hex to rgba with opacity */
function hexAlpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

// ── Marquee ────────────────────────────────────────────────────────────────────

interface MarqueeProps {
  text: string;
  bg: string;
  ink: string;
  speed?: number;
}

function Marquee({ text, bg, ink, speed = 40 }: MarqueeProps) {
  const repeated = Array.from({ length: 6 }).fill(text).join('  •  ');
  return (
    <div
      style={{
        overflow: 'hidden',
        background: bg,
        padding: '8px 0',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          animation: `epk-marquee ${speed}s linear infinite`,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: ink,
          paddingLeft: '100%',
        }}
      >
        {repeated}
      </div>
      <style>{`
        @keyframes epk-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media print {
          @keyframes epk-marquee { 0%, 100% { transform: none; } }
        }
      `}</style>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function EpkBrutalistTemplate({
  epk,
  locale,
  printMode = false,
}: EpkBrutalistTemplateProps) {
  const { artist } = epk;
  const brand = mergeBrand(epk.brand);
  const cssVars = buildCssVars(brand);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [riderOpen, setRiderOpen] = useState(false);

  // Derived
  // Skip slot 0 (hero cover) and slot 1 (artist portrait) — those are displayed elsewhere.
  const galleryImages = epk.galleryImageUrls.slice(2).filter(Boolean);
  const hasContacts = epk.bookingEmail || epk.managementContact || epk.pressContact || epk.location;

  // In print mode override to white-ink
  const bg = printMode ? '#FFFFFF' : brand.bg;
  const ink = printMode ? '#000000' : brand.ink;
  const primary = printMode ? '#000000' : brand.primary;
  const borderColor = printMode ? '#000000' : hexAlpha(brand.ink, 0.15);
  const surfaceBg = printMode ? '#F0F0F0' : hexAlpha(brand.ink, 0.05);

  // Labels
  const L = {
    en: {
      hire: 'Book this artist',
      pressKit: 'Press Kit',
      bio: 'Bio',
      highlights: 'Highlights',
      gallery: 'Photos',
      music: 'Music',
      links: 'Links',
      contacts: 'Press & Booking',
      booking: 'Booking',
      management: 'Management',
      press: 'Press',
      base: 'Location',
      rider: 'Rider & Booking info',
      riderShow: 'Show rider',
      riderHide: 'Hide rider',
      availability: 'Availability',
      artistReq: 'Artist requirements',
      techRider: 'Technical rider',
      recordLabels: 'Releases / Labels',
      printView: 'Print',
      poweredBy: 'POWERED BY STAGELINK.ART',
    },
    es: {
      hire: 'Contactar Artista',
      pressKit: 'Press Kit',
      bio: 'Bio',
      highlights: 'Destacados',
      gallery: 'Fotos',
      music: 'Música',
      links: 'Links',
      contacts: 'Prensa & Booking',
      booking: 'Booking',
      management: 'Management',
      press: 'Prensa',
      base: 'Base',
      rider: 'Rider & Booking info',
      riderShow: 'Ver rider',
      riderHide: 'Ocultar rider',
      availability: 'Disponibilidad',
      artistReq: 'Rider artístico',
      techRider: 'Rider técnico',
      recordLabels: 'Releases / Sellos',
      printView: 'Imprimir',
      poweredBy: 'POWERED BY STAGELINK.ART',
    },
  };
  const t = L[locale as keyof typeof L] ?? L.en;

  // Marquee content
  const marqueeText = [artist.displayName, epk.location, epk.headline]
    .filter(Boolean)
    .join('  ·  ');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        ...cssVars,
        background: bg,
        color: ink,
        minHeight: '100vh',
        fontFamily: "'Arial', 'Helvetica', sans-serif",
      }}
    >
      {/* ── Top accent bar ──────────────────────────────────────────────────── */}
      <div style={{ height: 8, background: primary }} />

      {/* ── Header band ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: `2px solid ${printMode ? primary : hexAlpha(brand.ink, 0.2)}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {artist.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.avatarUrl}
              alt={artist.displayName}
              style={{
                width: printMode ? 36 : 72,
                height: printMode ? 36 : 72,
                objectFit: 'cover',
                flexShrink: 0,
                border: `2px solid ${primary}`,
                filter: printMode ? 'grayscale(100%)' : 'none',
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                fontSize: printMode ? 22 : 26,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              {artist.displayName}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: primary,
              }}
            >
              {t.pressKit}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: hexAlpha(ink, 0.5),
            }}
          >
            {new Date().getFullYear()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!printMode && (
              <EpkLocaleSwitcher currentLocale={locale} username={artist.username} theme="brand" />
            )}
            {epk.bookingEmail && !printMode && (
              <a
                href={`mailto:${epk.bookingEmail}`}
                style={{
                  background: primary,
                  color: bg,
                  padding: '7px 18px',
                  fontSize: 12,
                  fontWeight: 900,
                  textDecoration: 'none',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {t.hire}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Marquee ─────────────────────────────────────────────────────────── */}
      {!printMode && marqueeText && <Marquee text={marqueeText} bg={primary} ink={bg} />}

      {/* ── Hero split: image + quote/contacts ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: epk.heroImageUrl && hasContacts ? '3fr 2fr' : '1fr',
          borderBottom: `2px solid ${borderColor}`,
        }}
      >
        {/* Left: Hero image */}
        {epk.heroImageUrl && (
          <div
            style={{
              borderRight: hasContacts ? `2px solid ${borderColor}` : 'none',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={epk.heroImageUrl}
              alt={artist.displayName}
              style={{
                width: '100%',
                height: printMode ? 220 : 360,
                objectFit: 'cover',
                display: 'block',
                filter: printMode ? 'grayscale(100%)' : 'none',
              }}
            />
          </div>
        )}

        {/* Right: Quote + Contacts */}
        {hasContacts || epk.pressQuote ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {epk.pressQuote && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: 10,
                  }}
                >
                  ◆ QUOTE
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: printMode ? 13 : 16,
                    fontStyle: 'italic',
                    lineHeight: 1.55,
                    color: ink,
                    borderLeft: `3px solid ${primary}`,
                    paddingLeft: 14,
                  }}
                >
                  &ldquo;{epk.pressQuote}&rdquo;
                </p>
              </div>
            )}
            {hasContacts && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: primary,
                    marginBottom: 10,
                  }}
                >
                  ◆ {t.contacts}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  {epk.bookingEmail && (
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: hexAlpha(ink, 0.5),
                          marginBottom: 1,
                        }}
                      >
                        {t.booking}
                      </span>
                      <a
                        href={`mailto:${epk.bookingEmail}`}
                        style={{ color: ink, textDecoration: 'none', fontWeight: 600 }}
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
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: hexAlpha(ink, 0.5),
                          marginBottom: 1,
                        }}
                      >
                        {t.management}
                      </span>
                      <span style={{ fontWeight: 600 }}>{epk.managementContact}</span>
                    </div>
                  )}
                  {epk.pressContact && (
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: hexAlpha(ink, 0.5),
                          marginBottom: 1,
                        }}
                      >
                        {t.press}
                      </span>
                      <span style={{ fontWeight: 600 }}>{epk.pressContact}</span>
                    </div>
                  )}
                  {epk.location && (
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: hexAlpha(ink, 0.5),
                          marginBottom: 1,
                        }}
                      >
                        {t.base}
                      </span>
                      <span style={{ fontWeight: 600 }}>{epk.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        {(epk.shortBio || epk.fullBio) && (
          <section style={{ padding: '32px 28px', borderBottom: `2px solid ${borderColor}` }}>
            <BrutalLabel label={t.bio} primary={primary} ink={ink} />
            {epk.shortBio && (
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: printMode ? 14 : 18,
                  lineHeight: 1.65,
                  color: ink,
                  fontWeight: 300,
                  maxWidth: 720,
                }}
              >
                {epk.shortBio}
              </p>
            )}
            {epk.fullBio && epk.fullBio !== epk.shortBio && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.85,
                  color: hexAlpha(ink, 0.7),
                  maxWidth: 700,
                  whiteSpace: 'pre-line',
                }}
              >
                {epk.fullBio}
              </p>
            )}
          </section>
        )}

        {/* ── Highlights ──────────────────────────────────────────────────── */}
        {epk.highlights.length > 0 && (
          <section style={{ padding: '32px 28px', borderBottom: `2px solid ${borderColor}` }}>
            <BrutalLabel label={t.highlights} primary={primary} ink={ink} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8,
              }}
            >
              {epk.highlights.map((h) => (
                <div
                  key={h}
                  style={{
                    padding: '10px 14px',
                    border: `1px solid ${borderColor}`,
                    background: surfaceBg,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span style={{ color: primary, fontWeight: 900, flexShrink: 0 }}>■</span>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: ink }}>
                    {h}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Gallery ─────────────────────────────────────────────────────── */}
        {galleryImages.length > 0 && (
          <section style={{ padding: '32px 28px', borderBottom: `2px solid ${borderColor}` }}>
            <BrutalLabel label={t.gallery} primary={primary} ink={ink} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {galleryImages.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`${artist.displayName} ${i + 1}`}
                  onClick={printMode ? undefined : () => setLightboxIndex(i)}
                  style={{
                    width: '100%',
                    height: printMode ? 100 : 180,
                    objectFit: 'cover',
                    display: 'block',
                    cursor: printMode ? 'default' : 'zoom-in',
                    filter: printMode ? 'grayscale(100%)' : 'none',
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Music ───────────────────────────────────────────────────────── */}
        {epk.featuredMedia.length > 0 && (
          <section style={{ padding: '32px 28px', borderBottom: `2px solid ${borderColor}` }}>
            <BrutalLabel label={t.music} primary={primary} ink={ink} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {epk.featuredMedia.map((item, i) => (
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
                    border: `1px solid ${borderColor}`,
                    textDecoration: 'none',
                    gap: 16,
                    background: i % 2 === 0 ? surfaceBg : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: primary,
                        fontWeight: 900,
                        minWidth: 20,
                        textAlign: 'right',
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: ink,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: primary,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {item.provider.toUpperCase()} ↗
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Links + Labels row ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: epk.recordLabels.length > 0 ? '1fr 1fr' : '1fr',
            gap: 0,
            borderBottom: `2px solid ${borderColor}`,
          }}
        >
          {epk.featuredLinks.length > 0 && (
            <section
              style={{
                padding: '28px',
                borderRight: epk.recordLabels.length > 0 ? `2px solid ${borderColor}` : 'none',
              }}
            >
              <BrutalLabel label={t.links} primary={primary} ink={ink} />
              {printMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {epk.featuredLinks.map((lnk) => (
                    <div
                      key={lnk.id}
                      style={{
                        padding: '6px 10px',
                        border: `1px solid ${borderColor}`,
                        background: surfaceBg,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: ink }}>
                        {lnk.label}
                      </p>
                      <p
                        style={{
                          margin: '1px 0 0',
                          fontSize: 10,
                          color: hexAlpha(ink, 0.5),
                          wordBreak: 'break-all',
                        }}
                      >
                        {lnk.url}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {epk.featuredLinks.map((lnk) => (
                    <a
                      key={lnk.id}
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '7px 14px',
                        border: `1px solid ${borderColor}`,
                        fontSize: 12,
                        fontWeight: 700,
                        color: ink,
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {lnk.label}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {epk.recordLabels.length > 0 && (
            <section style={{ padding: '28px' }}>
              <BrutalLabel label={t.recordLabels} primary={primary} ink={ink} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {epk.recordLabels.map((label) =>
                  label.websiteUrl && !printMode ? (
                    <a
                      key={label.id}
                      href={label.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '7px 14px',
                        border: `2px solid ${primary}`,
                        background: primary,
                        fontSize: 12,
                        fontWeight: 900,
                        color: bg,
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {label.name}
                    </a>
                  ) : (
                    <span
                      key={label.id}
                      style={{
                        padding: '7px 14px',
                        border: `2px solid ${printMode ? borderColor : primary}`,
                        background: printMode ? surfaceBg : 'transparent',
                        fontSize: 12,
                        fontWeight: 900,
                        color: ink,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {label.name}
                    </span>
                  ),
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Rider ───────────────────────────────────────────────────────── */}
        {(epk.riderInfo || epk.techRequirements || epk.availabilityNotes) && (
          <section style={{ padding: '28px', borderBottom: `2px solid ${borderColor}` }}>
            {printMode ? (
              <>
                <BrutalLabel label={t.rider} primary={primary} ink={ink} />
                <BrutalRiderContent epk={epk} ink={ink} primary={primary} labels={t} />
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
                    padding: '12px 16px',
                    background: surfaceBg,
                    border: `2px solid ${borderColor}`,
                    cursor: 'pointer',
                    color: ink,
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>◆ {t.rider}</span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      transition: 'transform 0.15s',
                      transform: riderOpen ? 'rotate(45deg)' : 'none',
                    }}
                  >
                    +
                  </span>
                </button>
                {riderOpen && (
                  <div
                    style={{
                      padding: '20px 16px',
                      border: `2px solid ${borderColor}`,
                      borderTop: 'none',
                    }}
                  >
                    <BrutalRiderContent epk={epk} ink={ink} primary={primary} labels={t} />
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* ── Bottom accent bar + footer ───────────────────────────────────────── */}
      <div style={{ height: 8, background: primary }} />
      <div
        style={{
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `2px solid ${borderColor}`,
          background: hexAlpha(primary, 0.06),
        }}
      >
        <a
          href="https://stagelink.art"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: hexAlpha(ink, 0.4),
            textDecoration: 'none',
          }}
        >
          {t.poweredBy}
        </a>
        {!printMode && (
          <a
            href={`/${locale}/${artist.username}/epk/print`}
            style={{
              fontSize: 11,
              color: hexAlpha(ink, 0.4),
              textDecoration: 'none',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {t.printView} ↗
          </a>
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

function BrutalLabel({ label, primary, ink }: { label: string; primary: string; ink: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span
        style={{
          width: 12,
          height: 12,
          background: primary,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: primary,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function BrutalRiderContent({
  epk,
  ink,
  primary,
  labels,
}: {
  epk: PublicEpkResponse;
  ink: string;
  primary: string;
  labels: { availability: string; artistReq: string; techRider: string };
}) {
  const rowStyle: React.CSSProperties = { marginBottom: 20 };
  const titleStyle: React.CSSProperties = {
    margin: '0 0 6px',
    fontSize: 9,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: primary,
  };
  const textStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.7,
    color: ink,
    whiteSpace: 'pre-line',
  };
  return (
    <div>
      {epk.availabilityNotes && (
        <div style={rowStyle}>
          <p style={titleStyle}>{labels.availability}</p>
          <p style={textStyle}>{epk.availabilityNotes}</p>
        </div>
      )}
      {epk.riderInfo && (
        <div style={rowStyle}>
          <p style={titleStyle}>{labels.artistReq}</p>
          <p style={textStyle}>{epk.riderInfo}</p>
        </div>
      )}
      {epk.techRequirements && (
        <div>
          <p style={titleStyle}>{labels.techRider}</p>
          <p style={textStyle}>{epk.techRequirements}</p>
        </div>
      )}
    </div>
  );
}
