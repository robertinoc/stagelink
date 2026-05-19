import { Activity, ExternalLink, ListChecks, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const umamiShareUrl = process.env.NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL;

const EVENTS = [
  'behind_nav_clicked',
  'behind_invite_opened',
  'behind_invitation_submitted',
  'behind_invitation_sent',
  'behind_invitation_failed',
  'behind_users_filtered',
  'behind_users_sorted',
  'behind_role_updated',
  'behind_user_status_updated',
  'behind_access_granted',
  'behind_access_extended',
  'behind_access_revoked',
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
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
              Live product usage
            </div>
            <p className="mt-1 text-xs text-white/45">Traffic, referrers, devices, and events.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Behind only
            </div>
            <p className="mt-1 text-xs text-white/45">Allowed domain: behind.stagelink.art.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <ListChecks className="h-4 w-4 text-sky-300" aria-hidden="true" />
              PII excluded
            </div>
            <p className="mt-1 text-xs text-white/45">No emails, names, handles, or search text.</p>
          </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Tracked product events</CardTitle>
            <CardDescription>
              Operational events captured by the Behind-only Umami website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </section>
  );
}
