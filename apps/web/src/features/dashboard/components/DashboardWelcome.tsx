import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BillingStatusBanner } from '@/components/billing/BillingStatusBanner';
import { Bento } from '@/components/sl/Bento';
import { Pill, Sparkline, Sparkbars } from '@/components/sl/SlPrimitives';
import type { Artist } from '@/lib/api/artists';
import type { BillingSummaryResponse } from '@/lib/api/billing';
import { DashboardShareStrip } from './DashboardShareStrip';

interface DashboardWelcomeProps {
  artist: Artist | null;
  billingSummary: BillingSummaryResponse | null;
}

// Mock sparkline data — will be replaced by real analytics once the API
// surfaces weekly aggregates on the dashboard endpoint.
const MOCK_SPARK = [12, 18, 14, 22, 31, 27, 57];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

export async function DashboardWelcome({ artist, billingSummary }: DashboardWelcomeProps) {
  const t = await getTranslations('dashboard.home');
  const locale = await getLocale();

  const GREETING_COUNT = 12;
  const greetingIndex = Math.floor(Math.random() * GREETING_COUNT);
  const artistName = artist?.displayName ?? artist?.username ?? 'Artist';
  const greeting = t(`intro.greeting_${greetingIndex}`, { name: artistName });

  const hasAnalytics = false; // Wire to real data when analytics API exposes weekly rollup
  const entitlements = billingSummary?.entitlements ?? {
    remove_stagelink_branding: false,
    custom_domain: false,
    shopify_integration: false,
    smart_merch: false,
    stage_link_insights: false,
    epk_builder: false,
    analytics_pro: false,
    multi_language_pages: false,
    advanced_fan_insights: false,
  };

  return (
    <div className="space-y-4 pb-8">
      {/* ── Billing banner (if any) ─────────────────────────────────────── */}
      {billingSummary ? <BillingStatusBanner summary={billingSummary} /> : null}

      {/* ── Header: greeting + share strip ─────────────────────────────── */}
      <div className="sl-header flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Eyebrow — date/day */}
          <p className="mb-2.5 font-[family-name:var(--font-heading)] text-[11px] font-semibold uppercase tracking-[3px] text-[#E040FB]">
            ·{' '}
            {new Date().toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            ·
          </p>
          {/* Main greeting */}
          <h1 className="m-0 max-w-[640px] font-[family-name:var(--font-heading)] text-[clamp(26px,4cqw,40px)] font-bold leading-[1.08] tracking-[-0.025em] text-white [text-wrap:pretty]">
            {greeting}
            <br />
            <span className="text-sl-grad">Your stage is live.</span>
          </h1>
        </div>

        {/* Share strip — only when username exists */}
        {artist?.username && <DashboardShareStrip username={artist.username} />}
      </div>

      {/* ── Hero stat card ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[24px] border border-white/10"
        style={{
          background:
            'linear-gradient(135deg, rgba(155,48,208,0.18) 0%, rgba(74,26,140,0.07) 60%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        {/* Atmospheric glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-120px] top-[-120px] h-[400px] w-[400px]"
          style={{
            background: 'radial-gradient(circle, rgba(224,64,251,0.28) 0%, transparent 60%)',
          }}
        />

        {hasAnalytics ? (
          <div className="sl-herostat grid items-center gap-8 p-7">
            {/* Left: stat */}
            <div className="relative">
              <div className="mb-2 text-[13px] text-white/50">{t('hero.eyebrow')}</div>
              <div
                className="mb-3 font-[family-name:var(--font-heading)] font-bold leading-none tracking-[-0.03em]"
                style={{
                  fontSize: 'clamp(40px, 8cqw, 56px)',
                  background: 'linear-gradient(135deg, #fff 0%, #E040FB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                181 people
              </div>
              <div className="mb-3 text-[16px] leading-relaxed text-white/70">
                {t('hero.suffix')}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="green">↑ 34%</Pill>
                <span className="text-[13px] text-white/50">{t('hero.trend_label')}</span>
              </div>
            </div>
            {/* Right: sparkline */}
            <div className="relative min-w-0">
              <div className="mb-2 flex justify-between font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[1px] text-white/30">
                {DAY_LABELS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <Sparkline data={MOCK_SPARK} color="#E040FB" height={100} width={500} />
              <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E040FB]" />
                  {t('hero.peak')}: 57 visits
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />7 {t('hero.aux_label')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Zero / no-data state */
          <div className="relative flex flex-col gap-3 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">
                {t('hero.no_data_title')}
              </p>
              <p className="mt-1 max-w-md text-sm text-white/60">{t('hero.no_data_body')}</p>
            </div>
            <div className="flex min-w-0 flex-1 items-end sm:justify-end">
              <Sparkbars data={[2, 3, 1, 4, 2, 3, 2]} color="rgba(155,48,208,0.4)" height={48} />
            </div>
          </div>
        )}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 font-[family-name:var(--font-heading)] text-[12px] font-semibold uppercase tracking-[1.5px] text-white/70">
          {t('actions.section_label')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Primary tile: share */}
          <ActionTile
            tone="pink"
            eyebrow={t('actions.share_eyebrow')}
            title={t('actions.share_title')}
            body={t('actions.share_body')}
            cta={t('actions.share_cta')}
            href={
              artist?.username
                ? `https://stagelink.art/${artist.username}`
                : `/${locale}/dashboard/profile`
            }
            external={!!artist?.username}
          />
          {/* My Page */}
          <ActionTile
            eyebrow={t('actions.my_page_eyebrow')}
            title={t('actions.my_page_title')}
            body={t('actions.my_page_body')}
            cta={t('actions.my_page_cta')}
            href={`/${locale}/dashboard/page`}
          />
          {/* Press Kit */}
          <ActionTile
            eyebrow={t('actions.epk_eyebrow')}
            title={t('actions.epk_title')}
            body={t('actions.epk_body')}
            cta={t('actions.epk_cta')}
            href={
              entitlements.epk_builder ? `/${locale}/dashboard/epk` : `/${locale}/dashboard/billing`
            }
            locked={!entitlements.epk_builder}
          />
        </div>
      </div>

      {/* ── Activity feed + Tip card ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Activity feed */}
        <Bento tone="panel" className="p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-[17px] font-bold text-white">
              {t('activity.title')}
            </h3>
            <Link
              href={`/${locale}/dashboard/analytics`}
              className="text-[12px] text-white/50 transition-colors hover:text-white"
            >
              {t('activity.view_all')}
            </Link>
          </div>
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-[13px] text-white/40">
            {t('activity.no_activity')}
          </p>
        </Bento>

        {/* Tip card */}
        <div
          className="relative flex flex-col overflow-hidden rounded-[20px] border border-[rgba(155,48,208,0.30)] p-5"
          style={{
            background:
              'linear-gradient(160deg, rgba(155,48,208,0.18) 0%, rgba(74,26,140,0.04) 100%)',
          }}
        >
          {/* Glow blob */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-40px] top-[-40px] h-[180px] w-[180px]"
            style={{
              background: 'radial-gradient(circle, rgba(224,64,251,0.22) 0%, transparent 60%)',
            }}
          />
          <div className="relative mb-3.5 inline-flex items-center gap-1.5 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px] text-[#E040FB]">
            <Sparkles className="h-3 w-3" />
            {t('tip.eyebrow')}
          </div>
          <h4 className="relative m-0 mb-2.5 font-[family-name:var(--font-heading)] text-[20px] font-bold leading-[1.2] text-white">
            {t('tip.title')}
          </h4>
          <p className="relative flex-1 text-[13.5px] leading-[1.55] text-white/70">
            {t('tip.body')}
          </p>
          <Link
            href={`/${locale}/dashboard/page`}
            className="relative mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-[rgba(224,64,251,0.4)] bg-transparent px-4 py-2.5 text-[13px] font-semibold text-[#E040FB] transition-colors hover:bg-[rgba(224,64,251,0.08)]"
          >
            {t('tip.cta')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── ActionTile ──────────────────────────────────────────────────────────────

interface ActionTileProps {
  tone?: 'pink' | 'default';
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  external?: boolean;
  locked?: boolean;
}

function ActionTile({
  tone = 'default',
  eyebrow,
  title,
  body,
  cta,
  href,
  external,
  locked,
}: ActionTileProps) {
  const isPrimary = tone === 'pink';

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="group relative flex min-h-[140px] flex-col overflow-hidden rounded-[20px] border p-[22px] transition-opacity hover:opacity-90"
      style={{
        background: isPrimary
          ? 'linear-gradient(135deg, #9B30D0 0%, #4A1A8C 100%)'
          : 'rgba(255,255,255,0.025)',
        border: isPrimary ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.10)',
        boxShadow: isPrimary ? '0 0 32px rgba(224,64,251,0.25)' : 'none',
      }}
    >
      {/* Eyebrow + icon row */}
      <div className="mb-3.5 flex items-center justify-between">
        <span
          className="font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px]"
          style={{ color: isPrimary ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.50)' }}
        >
          {locked ? '🔒 ' : ''}
          {eyebrow}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{
            background: isPrimary ? 'rgba(255,255,255,0.15)' : 'rgba(224,64,251,0.12)',
            color: isPrimary ? '#ffffff' : '#E040FB',
          }}
        >
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <h4 className="m-0 mb-2 font-[family-name:var(--font-heading)] text-[20px] font-bold leading-[1.15] text-white">
        {title}
      </h4>
      <p
        className="m-0 flex-1 text-[13.5px] leading-[1.55]"
        style={{ color: isPrimary ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.70)' }}
      >
        {body}
      </p>

      <div
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold"
        style={{ color: isPrimary ? '#ffffff' : '#E040FB' }}
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
