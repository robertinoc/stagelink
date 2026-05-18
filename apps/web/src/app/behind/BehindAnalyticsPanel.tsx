import { BarChart3, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const umamiShareUrl = process.env.NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL;

const EVENTS = [
  'behind_nav_clicked',
  'behind_invite_opened',
  'behind_invitation_sent',
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
    <section className="space-y-4" aria-labelledby="behind-analytics-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="behind-analytics-heading"
            className="text-xl font-semibold font-[family-name:var(--font-heading)]"
            style={{ color: 'var(--foreground)' }}
          >
            Behind the Stage — Analytics
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Internal product analytics for the StageLink operator dashboard.
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
              Open Umami
            </a>
          </Button>
        )}
      </div>

      {!compact && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                Product Usage
              </CardTitle>
              <CardDescription>Pageviews, visits, referrers, and device context.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                Scoped To Behind
              </CardTitle>
              <CardDescription>
                Tracker allowlist is limited to behind.stagelink.art.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No Artist Analytics</CardTitle>
              <CardDescription>
                Public artist traffic and artist dashboards stay out of this Umami website.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Umami dashboard</CardTitle>
          <CardDescription>
            {umamiShareUrl
              ? 'Live StageLink Behind dashboard embedded from Umami.'
              : 'Set NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL to embed the shared Umami dashboard here.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {umamiShareUrl ? (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <iframe
                title="StageLink Behind Umami dashboard"
                src={umamiShareUrl}
                className={
                  compact ? 'h-[520px] w-full bg-background' : 'h-[720px] w-full bg-background'
                }
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-6">
              <p className="text-sm text-white/55">
                The Behind dashboard is ready for Umami. Configure the website ID and optional share
                URL, then deploy to `behind.stagelink.art`.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-white/45 sm:grid-cols-2">
                <code>NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID</code>
                <code>NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL</code>
                <code>NEXT_PUBLIC_UMAMI_DOMAINS=behind.stagelink.art</code>
                <code>NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js</code>
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
              Events are operational and avoid emails, names, user IDs, handles, and search text.
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
