import {
  Activity,
  ExternalLink,
  Filter,
  ListChecks,
  MousePointerClick,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const umamiShareUrl = process.env.NEXT_PUBLIC_UMAMI_PLATFORM_SHARE_URL;

const EVENTS = [
  'auth_signup_started',
  'auth_signup_completed',
  'auth_signup_login_clicked',
  'auth_login_started',
  'auth_login_signup_clicked',
] as const;

const DASHBOARD_MODULES = [
  {
    title: 'Traffic overview',
    description: 'StageLink landing, auth, onboarding, and dashboard traffic.',
    icon: Activity,
  },
  {
    title: 'UTM campaigns',
    description: 'Campaign sessions on stagelink.art, including signup and outreach links.',
    icon: TrendingUp,
  },
  {
    title: 'Product events',
    description: 'Signup/login intent events plus product pageviews inside the app dashboard.',
    icon: MousePointerClick,
  },
] as const;

const UTM_FIELDS = [
  ['utm_source', 'whatsapp | email | instagram_dm | manual_outreach'],
  ['utm_medium', 'direct_message | email_invite | referral'],
  ['utm_campaign', 'stagelink_growth_2026_q2'],
  ['utm_content', 'artist_beta | pro_lead | friend_referral'],
] as const;

const VALIDATION_CHECKS = [
  'Open stagelink.art and confirm the Umami script loads after analytics consent.',
  'Open /es/signup and confirm a pageview appears in the StageLink Platform website.',
  'Complete a new signup and confirm auth_signup_completed appears after authenticated return.',
  'Start login to trigger auth_login_started.',
  'Open /es/dashboard with an authenticated account and confirm product pageviews.',
  'Open behind.stagelink.art and confirm it only embeds Umami, without loading its tracker.',
] as const;

interface BehindAnalyticsPanelProps {
  compact?: boolean;
}

export function BehindAnalyticsPanel({ compact = false }: BehindAnalyticsPanelProps) {
  const GRADIENT = 'linear-gradient(135deg, #E040FB 0%, #9B30D0 45%, #4A1A8C 100%)';

  return (
    <section className="space-y-5" aria-labelledby="behind-analytics-heading">
      {/* ── Section header (new design) ─────────────────────────────────── */}
      <div
        style={{
          padding: '36px 0 20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase' as const,
              color: '#E040FB',
              marginBottom: 8,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            BEHIND THE STAGE · PRODUCT
          </p>
          <h2
            id="behind-analytics-heading"
            style={{
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              fontFamily: '"Space Grotesk", sans-serif',
              margin: 0,
            }}
          >
            <span style={{ color: '#fff' }}>StageLink platform </span>
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              analytics.
            </span>
          </h2>
          <p
            style={{
              marginTop: 10,
              fontSize: 15,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.55,
              maxWidth: 460,
            }}
          >
            Product analytics collected from stagelink.art and reviewed from Behind.
          </p>
        </div>

        {umamiShareUrl && (
          <Button asChild size="sm" variant="outline" style={{ flexShrink: 0 }}>
            <a href={umamiShareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open in Umami
            </a>
          </Button>
        )}
      </div>

      {!compact && (
        <div className="grid gap-4 md:grid-cols-3">
          {DASHBOARD_MODULES.map((module, i) => {
            const Icon = module.icon;
            const accents = ['#E040FB', '#00D4FF', '#9B30D0'];
            const accent = accents[i % accents.length];
            return (
              <div
                key={module.title}
                style={{
                  borderRadius: 20,
                  padding: '20px 22px',
                  background: `radial-gradient(ellipse 80% 60% at 90% 10%, ${accent}14 0%, transparent 65%), rgba(255,255,255,0.025)`,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: `${accent}18`,
                    border: `1px solid ${accent}28`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: '"Space Grotesk", sans-serif',
                    marginBottom: 6,
                  }}
                >
                  {module.title}
                </p>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {module.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Umami dashboard</CardTitle>
            <CardDescription>
              {umamiShareUrl
                ? 'Embedded from the StageLink Platform website in Umami.'
                : 'Add the shared StageLink Platform Umami URL in Vercel to enable the embedded dashboard.'}
            </CardDescription>
          </div>
          <span
            className="w-fit rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/45"
            aria-label={umamiShareUrl ? 'Umami embed configured' : 'Umami embed needs setup'}
          >
            {umamiShareUrl ? 'Embed configured' : 'Setup needed'}
          </span>
        </CardHeader>
        <CardContent>
          {umamiShareUrl ? (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-[#1c1c1c] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <iframe
                title="StageLink Platform Umami dashboard"
                src={umamiShareUrl}
                className={
                  compact ? 'h-[540px] w-full bg-[#1c1c1c]' : 'h-[760px] w-full bg-[#1c1c1c]'
                }
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-6">
              <div className="max-w-2xl">
                <h3 className="text-base font-semibold text-white/85">Embed not configured</h3>
                <p className="mt-2 text-sm text-white/55">
                  Set the public share URL in Vercel and redeploy Behind to render the live Umami
                  dashboard here.
                </p>
              </div>
              <div className="mt-5 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
                <code className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  NEXT_PUBLIC_UMAMI_PLATFORM_SHARE_URL
                </code>
                <code className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID
                </code>
                <code className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  NEXT_PUBLIC_UMAMI_DOMAINS=stagelink.art
                </code>
                <code className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
                </code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!compact && (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                  UTM campaigns
                </CardTitle>
                <CardDescription>
                  Campaign naming for platform links. UTM sessions are collected on stagelink.art
                  and reviewed here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {UTM_FIELDS.map(([field, example]) => (
                    <div
                      key={field}
                      className="grid gap-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs sm:grid-cols-[8rem_minmax(0,1fr)]"
                    >
                      <code className="font-semibold text-white/75">{field}</code>
                      <span className="text-white/45">{example}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  Manual validation
                </CardTitle>
                <CardDescription>
                  End-to-end checks for the StageLink Platform Umami setup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-2">
                  {VALIDATION_CHECKS.map((check, index) => (
                    <li
                      key={check}
                      className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55"
                    >
                      <span className="font-semibold text-white/35">{index + 1}</span>
                      <span>{check}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-primary" aria-hidden="true" />
                  Tracked product events
                </CardTitle>
                <CardDescription>
                  Explicit events captured by the StageLink Platform Umami website.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EVENTS.map((event) => (
                    <code
                      key={event}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65"
                    >
                      {event}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  Native dashboard path
                </CardTitle>
                <CardDescription>
                  Future API-backed metrics can replace selected iframe sections after platform
                  tracking is validated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-white/50">
                  <p>Current source: shared StageLink Platform Umami iframe.</p>
                  <p>Next source: server-side Umami API/widgets with no public token exposure.</p>
                  <p>Constraint: Behind is only the viewer, not the tracked product surface.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Privacy guardrail
            </div>
            <p className="mt-1 text-xs text-white/45">
              Umami tracks StageLink platform traffic only after analytics consent. Behind is only
              the viewer, and explicit event properties must exclude emails, names, handles, user
              IDs, artist IDs, search text, and free-form content.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
