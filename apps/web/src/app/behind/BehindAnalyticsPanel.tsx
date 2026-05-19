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

const umamiShareUrl = process.env.NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL;

const EVENTS = [
  'behind_nav_clicked',
  'behind_logout_clicked',
  'behind_umami_opened',
  'behind_invite_opened',
  'behind_invitation_submitted',
  'behind_invitation_sent',
  'behind_invitation_failed',
  'behind_users_filtered',
  'behind_users_sorted',
  'behind_user_profile_updated',
  'behind_role_updated',
  'behind_user_status_updated',
  'behind_access_granted',
  'behind_access_extended',
  'behind_access_revoked',
] as const;

const DASHBOARD_MODULES = [
  {
    title: 'Traffic overview',
    description: 'Pageviews, visitors, visits, referrers, device context, and geography.',
    icon: Activity,
  },
  {
    title: 'Campañas UTM',
    description: 'Use the campaign templates to compare WhatsApp, email, referrals, and outreach.',
    icon: TrendingUp,
  },
  {
    title: 'Eventos behind_*',
    description:
      'Navigation, invitation funnel, filters, sorting, roles, status, and access actions.',
    icon: MousePointerClick,
  },
] as const;

const UTM_FIELDS = [
  ['utm_source', 'whatsapp | email | instagram_dm | manual_outreach'],
  ['utm_medium', 'direct_message | email_invite | referral'],
  ['utm_campaign', 'behind_invites_2026_q2'],
  ['utm_content', 'artist_beta | pro_lead | friend_referral'],
] as const;

const VALIDATION_CHECKS = [
  'Open behind.stagelink.art and confirm the Umami script loads only there.',
  'Open /behind/analytics and confirm a pageview appears in Umami.',
  'Switch between Users and Analytics to trigger behind_nav_clicked.',
  'Open and submit an invite to trigger the invitation funnel events.',
  'Verify event properties exclude PII and free-text values.',
] as const;

interface BehindAnalyticsPanelProps {
  compact?: boolean;
}

export function BehindAnalyticsPanel({ compact = false }: BehindAnalyticsPanelProps) {
  return (
    <section className="space-y-5" aria-labelledby="behind-analytics-heading">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="behind-analytics-heading"
            className="text-xl font-semibold font-[family-name:var(--font-heading)]"
            style={{ color: 'var(--foreground)' }}
          >
            Behind the Stage - Analytics
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Product analytics for StageLink operations.
          </p>
        </div>
        {umamiShareUrl && (
          <Button asChild size="sm" variant="outline">
            <a
              href={umamiShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="behind_umami_opened"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open in Umami
            </a>
          </Button>
        )}
      </div>

      {!compact && (
        <div className="grid gap-3 md:grid-cols-3">
          {DASHBOARD_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.title}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {module.title}
                </div>
                <p className="mt-1 text-xs text-white/45">{module.description}</p>
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
                ? 'Embedded from the StageLink Behind website in Umami.'
                : 'Add the shared Umami URL in Vercel to enable the embedded dashboard.'}
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
                title="StageLink Behind Umami dashboard"
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
                  NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL
                </code>
                <code className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID
                </code>
                <code className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                  NEXT_PUBLIC_UMAMI_DOMAINS=behind.stagelink.art
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
                  Campaign naming for outreach links. Visitor-side UTM sessions stay outside this
                  Behind-only Umami website.
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
                  End-to-end checks for the current Behind Umami setup.
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
                  Operational events captured by the Behind-only Umami website.
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
                  Future API-backed metrics can replace selected iframe sections after v1
                  validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-white/50">
                  <p>Current source: shared Umami iframe.</p>
                  <p>Next source: server-side Umami API/widgets with no public token exposure.</p>
                  <p>Constraint: keep public pages and artist dashboards out of this website.</p>
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
              Umami remains limited to behind.stagelink.art and event properties exclude emails,
              names, handles, user IDs, artist IDs, search text, and outreach content.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
