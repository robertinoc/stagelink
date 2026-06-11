'use client';

// Tab 2 — Redes y música
// Platform overview + 4 groups (social / streaming / stores / contact)
// All platforms are always editable. A "Mostrar en mi página" checkbox next
// to each filled-in link controls public visibility. Plan limits how many
// checkboxes can be checked at the same time (Free=5, Pro=8, Pro+=13).

import { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Bento } from '@/components/sl/Bento';
import { Glow } from '@/components/sl/SlPrimitives';
import { BentoLabel } from '@/components/sl/Bento';
import { SocialField } from '../SocialField';
import { SubHead, Chip } from '../SubHead';
import type { ProfileFormValues } from '../../schemas/profile.schema';

interface Platform {
  key: keyof ProfileFormValues;
  icon: string;
  name: string;
  placeholder: string;
  brand: string;
  helper?: string;
}

const GROUPS: { title: string; hint: string; platforms: Platform[] }[] = [
  {
    title: 'Redes sociales',
    hint: 'Cómo te encuentran los fans',
    platforms: [
      {
        key: 'instagramUrl',
        icon: '📷',
        name: 'Instagram',
        placeholder: 'https://instagram.com/...',
        brand: '#E1306C',
      },
      {
        key: 'tiktokUrl',
        icon: '🎬',
        name: 'TikTok',
        placeholder: 'https://tiktok.com/@...',
        brand: '#fe2c55',
      },
      {
        key: 'youtubeUrl',
        icon: '▶',
        name: 'YouTube',
        placeholder: 'https://youtube.com/@...',
        brand: '#FF0000',
      },
    ],
  },
  {
    title: 'Streaming · música',
    hint: 'Donde escuchan tus sets y releases',
    platforms: [
      {
        key: 'spotifyUrl',
        icon: '🎵',
        name: 'Spotify',
        placeholder: 'https://open.spotify.com/artist/...',
        brand: '#1DB954',
      },
      {
        key: 'appleMusicUrl',
        icon: '🍎',
        name: 'Apple Music',
        placeholder: 'https://music.apple.com/...',
        brand: '#fc3c44',
      },
      {
        key: 'soundcloudUrl',
        icon: '☁️',
        name: 'SoundCloud',
        placeholder: 'https://soundcloud.com/...',
        brand: '#ff8800',
      },
      {
        key: 'amazonMusicUrl',
        icon: '🔊',
        name: 'Amazon Music',
        placeholder: 'https://music.amazon.com/artists/...',
        brand: '#00A8E1',
      },
      {
        key: 'deezerUrl',
        icon: '🎧',
        name: 'Deezer',
        placeholder: 'https://deezer.com/artist/...',
        brand: '#00C7F2',
      },
      {
        key: 'tidalUrl',
        icon: '🌊',
        name: 'Tidal',
        placeholder: 'https://listen.tidal.com/artist/...',
        brand: '#ffffff',
      },
    ],
  },
  {
    title: 'Music stores',
    hint: 'Para DJs y la industria',
    platforms: [
      {
        key: 'beatportUrl',
        icon: '🎚️',
        name: 'Beatport',
        placeholder: 'https://beatport.com/artist/...',
        brand: '#a4d922',
      },
      {
        key: 'traxsourceUrl',
        icon: '🎛️',
        name: 'Traxsource',
        placeholder: 'https://traxsource.com/artist/...',
        brand: '#41bd87',
      },
    ],
  },
  {
    title: 'Contacto y sitio',
    hint: 'Para promoters, prensa, fans',
    platforms: [
      {
        key: 'websiteUrl',
        icon: '🌐',
        name: 'Sitio web',
        placeholder: 'https://tu-sitio.com',
        brand: '#ffffff',
      },
      {
        key: 'contactEmail',
        icon: '✉️',
        name: 'Email de contacto',
        placeholder: 'tu@email.com',
        brand: '#ffffff',
        helper: 'Contacto público para booking o prensa. No se usa para iniciar sesión.',
      },
    ],
  },
];

// All platforms flat list for the chip strip
const ALL_PLATFORMS: { key: keyof ProfileFormValues; brand: string; icon: string; name: string }[] =
  GROUPS.flatMap((g) => g.platforms);

interface SocialTabProps {
  form: UseFormReturn<ProfileFormValues>;
  /** Max links that can be shown on the public page (Free=5, Pro=8, Pro+=13). Default 13. */
  maxSocialLinks?: number;
  /** Billing upgrade href shown in the limit warning. */
  billingHref?: string;
}

export function SocialTab({ form, maxSocialLinks = 13, billingHref }: SocialTabProps) {
  const { watch, setValue } = form;
  const isMobile = useIsMobile();
  const [limitHit, setLimitHit] = useState(false);

  const values = watch();
  const shownLinks: string[] = values.shownLinks ?? [];

  const activePlatforms = ALL_PLATFORMS.filter((p) => {
    const v = values[p.key];
    return typeof v === 'string' && v.trim().length > 0;
  });

  const visibleCount = shownLinks.filter((key) => {
    // only count keys that still have a URL (auto-cleanup guard)
    const v = values[key as keyof ProfileFormValues];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;

  function toggleShown(key: string, currentlyShown: boolean) {
    if (currentlyShown) {
      setLimitHit(false);
      setValue(
        'shownLinks',
        shownLinks.filter((k) => k !== key),
        { shouldDirty: true },
      );
    } else {
      if (visibleCount >= maxSocialLinks) {
        setLimitHit(true);
        return;
      }
      setLimitHit(false);
      setValue('shownLinks', [...shownLinks, key], { shouldDirty: true });
    }
  }

  function handleUrlChange(key: keyof ProfileFormValues, newVal: string) {
    setValue(key, newVal as never, { shouldDirty: true });
    // If the URL was cleared, auto-remove from shownLinks
    if (!newVal.trim()) {
      setValue(
        'shownLinks',
        shownLinks.filter((k) => k !== String(key)),
        { shouldDirty: true },
      );
      setLimitHit(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Overview card */}
      <Bento tone="accent" pad={isMobile ? 16 : 22} glow>
        <Glow x="100%" y="0%" color="rgba(0,212,255,0.2)" size={320} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          {/* Left — headline */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <BentoLabel tint="#E040FB">Tus plataformas</BentoLabel>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 32,
                fontWeight: 700,
                background: 'linear-gradient(135deg,#E040FB,#4A1A8C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.1,
                marginTop: 8,
              }}
            >
              {activePlatforms.length}
              <span
                style={{
                  WebkitTextFillColor: 'rgba(255,255,255,0.50)',
                  color: 'rgba(255,255,255,0.50)',
                  fontSize: 16,
                  fontWeight: 400,
                  marginLeft: 8,
                }}
              >
                de {ALL_PLATFORMS.length} conectadas
              </span>
            </div>
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.5,
              }}
            >
              Ingresá todos tus links. Usá el checkbox{' '}
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Mostrar en mi página</strong> para
              elegir cuáles aparecen públicamente
              {maxSocialLinks < 13 ? ` (máximo ${maxSocialLinks} en tu plan actual)` : ''}.
            </p>
            {/* Visibility counter */}
            <div
              style={{
                marginTop: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'rgba(224,64,251,0.12)',
                border: '1px solid rgba(224,64,251,0.25)',
              }}
            >
              <span style={{ fontSize: 13, color: '#E040FB', fontWeight: 700 }}>
                {visibleCount}/{maxSocialLinks}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                visibles en página
              </span>
            </div>
          </div>

          {/* Right — chip strip */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              padding: 8,
              borderRadius: 16,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              alignContent: 'flex-start',
              maxWidth: 260,
            }}
          >
            {ALL_PLATFORMS.map((p) => {
              const v = values[p.key];
              const connected = typeof v === 'string' && v.trim().length > 0;
              const shown = shownLinks.includes(String(p.key));
              return (
                <span
                  key={p.key as string}
                  title={
                    connected
                      ? shown
                        ? `${p.name} — visible en página`
                        : `${p.name} — oculto`
                      : p.name
                  }
                  style={{
                    position: 'relative',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: connected ? `${p.brand}33` : 'transparent',
                    border: connected
                      ? `1px solid ${p.brand}88`
                      : '1px dashed rgba(255,255,255,0.14)',
                    opacity: connected ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}
                >
                  {p.icon}
                  {connected && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: shown ? '#4ADE80' : 'rgba(255,255,255,0.3)',
                        border: '2px solid #1a0a30',
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </Bento>

      {/* Limit warning banner */}
      {limitHit && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 12,
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1.4 }}>⚠️</span>
          <p style={{ fontSize: 12.5, color: 'rgba(251,191,36,0.9)', lineHeight: 1.5, margin: 0 }}>
            Ya tenés {maxSocialLinks} links visibles, que es el máximo de tu plan.
            {billingHref && (
              <>
                {' '}
                <a
                  href={billingHref}
                  style={{ color: '#E040FB', fontWeight: 600, textDecoration: 'none' }}
                >
                  Mejorá tu plan
                </a>{' '}
                para mostrar más.
              </>
            )}
          </p>
        </div>
      )}

      {/* Platform groups */}
      {GROUPS.map((group) => {
        const filledCount = group.platforms.filter((p) => {
          const v = values[p.key];
          return typeof v === 'string' && v.trim().length > 0;
        }).length;

        return (
          <Bento key={group.title} pad={isMobile ? 16 : 22}>
            <SubHead
              title={group.title}
              hint={group.hint}
              right={
                <Chip>
                  {filledCount}/{group.platforms.length}
                </Chip>
              }
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {group.platforms.map((p) => {
                const raw = values[p.key];
                const val = typeof raw === 'string' ? raw : '';
                const hasUrl = val.trim().length > 0;
                const isShown = shownLinks.includes(String(p.key));
                const atLimit = !isShown && visibleCount >= maxSocialLinks;

                return (
                  <div
                    key={p.key as string}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <SocialField
                      name={p.name}
                      icon={p.icon}
                      brand={p.brand}
                      placeholder={p.placeholder}
                      value={val}
                      onChange={(v) => handleUrlChange(p.key, v)}
                      helper={p.helper}
                    />
                    {/* Visibility checkbox — only shown when URL is filled */}
                    {hasUrl && (
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: atLimit && !isShown ? 'not-allowed' : 'pointer',
                          alignSelf: 'flex-start',
                          paddingLeft: 4,
                        }}
                        title={
                          atLimit && !isShown
                            ? `Límite de ${maxSocialLinks} links visibles alcanzado`
                            : isShown
                              ? 'Quitar de la página pública'
                              : 'Mostrar en mi página pública'
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isShown}
                          disabled={atLimit && !isShown}
                          onChange={() => toggleShown(String(p.key), isShown)}
                          style={{
                            width: 15,
                            height: 15,
                            accentColor: '#E040FB',
                            cursor: atLimit && !isShown ? 'not-allowed' : 'pointer',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: isShown
                              ? 'rgba(255,255,255,0.8)'
                              : atLimit
                                ? 'rgba(255,255,255,0.3)'
                                : 'rgba(255,255,255,0.5)',
                            fontWeight: isShown ? 600 : 400,
                          }}
                        >
                          Mostrar en mi página
                        </span>
                        {isShown && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 10,
                              background: 'rgba(74,222,128,0.15)',
                              color: '#4ADE80',
                              border: '1px solid rgba(74,222,128,0.3)',
                              fontWeight: 700,
                              letterSpacing: 0.3,
                            }}
                          >
                            VISIBLE
                          </span>
                        )}
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </Bento>
        );
      })}
    </div>
  );
}
