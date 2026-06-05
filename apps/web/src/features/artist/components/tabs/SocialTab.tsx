'use client';

// Tab 2 — Redes y música
// Platform overview + 4 groups (social / streaming / stores / contact)

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
  /** Max platforms allowed by plan (Free=5, Pro=8, Pro+=13). Default 13. */
  maxSocialLinks?: number;
  /** Billing upgrade href for the lock CTA. */
  billingHref?: string;
}

export function SocialTab({ form, maxSocialLinks = 13, billingHref }: SocialTabProps) {
  const { watch, setValue } = form;
  const isMobile = useIsMobile();
  // Running index across groups to apply the per-plan limit
  let globalPlatformIndex = 0;

  const values = watch();
  const activePlatforms = ALL_PLATFORMS.filter((p) => {
    const v = values[p.key];
    return typeof v === 'string' && v.trim().length > 0;
  });

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
                marginTop: 8,
                fontSize: 13,
                color: 'rgba(255,255,255,0.70)',
                lineHeight: 1.5,
              }}
            >
              Los links vacíos no aparecen en tu página. Solo se muestran los que llenás.
            </p>
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
              return (
                <span
                  key={p.key}
                  title={p.name}
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
                        background: '#4ADE80',
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
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}
            >
              {group.platforms.map((p) => {
                const platformIndex = globalPlatformIndex++;
                const isLocked = platformIndex >= maxSocialLinks;
                const raw = values[p.key];
                const val = typeof raw === 'string' ? raw : '';

                if (isLocked) {
                  return (
                    <div
                      key={p.key}
                      style={{
                        borderRadius: 12,
                        border: '1px dashed rgba(255,255,255,0.1)',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        opacity: 0.5,
                      }}
                    >
                      <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{p.icon}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', flex: 1 }}>
                        {p.name}
                      </span>
                      {billingHref ? (
                        <a
                          href={billingHref}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(224,64,251,0.12)',
                            color: '#E040FB',
                            border: '1px solid rgba(224,64,251,0.25)',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🔒 Upgrade
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>🔒</span>
                      )}
                    </div>
                  );
                }

                return (
                  <SocialField
                    key={p.key}
                    name={p.name}
                    icon={p.icon}
                    brand={p.brand}
                    placeholder={p.placeholder}
                    value={val}
                    onChange={(v) => setValue(p.key, v as never, { shouldDirty: true })}
                    helper={p.helper}
                  />
                );
              })}
            </div>
          </Bento>
        );
      })}
    </div>
  );
}
