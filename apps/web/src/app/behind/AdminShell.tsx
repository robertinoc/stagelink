'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Design tokens ──────────────────────────────────────────────────────────────
const GRADIENT = 'linear-gradient(135deg, #E040FB 0%, #9B30D0 45%, #4A1A8C 100%)';

// ─── Inline SVG icons ───────────────────────────────────────────────────────────
function UsersIcon({ color }: { color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BarChartIcon({ color }: { color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function TrendingIcon({ color }: { color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Nav config ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/behind', label: 'Users', Icon: UsersIcon, exact: true },
  { href: '/behind/analytics', label: 'Analytics', Icon: BarChartIcon, exact: false },
] as const;

// ─── AdminShell ─────────────────────────────────────────────────────────────────
export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#0D0A1A',
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* ── Top brand bar ──────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 60,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(18px) saturate(150%)',
          backgroundColor: 'rgba(13,10,26,0.75)',
        }}
      >
        {/* Left: wordmark + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: '#fff' }}>Stage</span>
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Link
            </span>
          </span>

          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>·</span>

          <span
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 13.5,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Behind the Stage
          </span>

          {/* ADMIN badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid rgba(224,64,251,0.28)',
              backgroundColor: 'rgba(224,64,251,0.12)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#E040FB',
              textTransform: 'uppercase',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            <ShieldIcon />
            ADMIN
          </span>
        </div>

        {/* Right: email + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            className="hidden sm:block"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}
          >
            {email}
          </span>
          <a
            href="/api/auth/signout"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 13px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 12.5,
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s',
            }}
          >
            <LogOutIcon />
            Log out
          </a>
        </div>
      </header>

      {/* ── Body row ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left rail — hidden on mobile, visible on lg */}
        <nav
          className="hidden lg:flex"
          style={{
            width: 218,
            flexShrink: 0,
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            padding: '24px 12px',
            gap: 2,
          }}
        >
          {/* DASHBOARD label */}
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              marginBottom: 6,
              paddingLeft: 8,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            DASHBOARD
          </p>

          {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '9px 10px',
                  borderRadius: 11,
                  border: active ? '1px solid rgba(155,48,208,0.32)' : '1px solid transparent',
                  backgroundColor: active ? 'rgba(155,48,208,0.18)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: '"Space Grotesk", sans-serif',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Icon color={active ? '#E040FB' : 'rgba(255,255,255,0.35)'} />
                {label}
              </Link>
            );
          })}

          {/* ROADMAP label */}
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              margin: '18px 0 6px',
              paddingLeft: 8,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            ROADMAP
          </p>

          {/* Business Board — disabled */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 10px',
              borderRadius: 11,
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.28)',
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: '"Space Grotesk", sans-serif',
              opacity: 0.65,
              cursor: 'not-allowed',
              userSelect: 'none',
            }}
          >
            <TrendingIcon color="rgba(255,255,255,0.2)" />
            Business Board
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              PRONTO
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background:
                'linear-gradient(135deg, rgba(74,26,140,0.35) 0%, rgba(155,48,208,0.15) 100%)',
              border: '1px solid rgba(155,48,208,0.2)',
            }}
          >
            <p
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.65)',
                marginBottom: 3,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              StageLink Platform
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Panel interno · datos en vivo desde stagelink.art
            </p>
          </div>
        </nav>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {/* Ambient gradient */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `
                radial-gradient(ellipse 60% 45% at 80% -8%, rgba(155,48,208,0.16) 0%, transparent 55%),
                radial-gradient(ellipse 40% 30% at 5% 105%, rgba(0,212,255,0.06) 0%, transparent 60%)
              `,
            }}
          />

          {/* Mobile tab nav (hidden on lg) */}
          <div
            className="flex lg:hidden"
            style={{
              gap: 6,
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              overflowX: 'auto',
            }}
          >
            {NAV_ITEMS.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: active
                      ? '1px solid rgba(155,48,208,0.32)'
                      : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: active ? 'rgba(155,48,208,0.18)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: '"Space Grotesk", sans-serif',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Page content */}
          <div style={{ position: 'relative', padding: '0 32px 48px' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
