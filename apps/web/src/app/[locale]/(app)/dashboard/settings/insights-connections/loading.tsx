/**
 * loading.tsx — Settings > Insights Connections skeleton.
 * Mirrors SettingsSectionShell + InsightsConnectionsSection (platform connection cards).
 */
export default function InsightsConnectionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back breadcrumb */}
      <div className="h-4 w-24 rounded bg-white/[0.06]" />

      {/* Section header */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-white/[0.06]" />
        <div className="h-7 w-56 rounded bg-white/10" />
        <div className="h-4 w-80 rounded bg-white/[0.06]" />
      </div>

      {/* Connection cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="h-5 w-24 rounded bg-white/10" />
                  <div className="h-4 w-48 rounded bg-white/[0.06]" />
                </div>
              </div>
              <div className="h-9 w-28 rounded-lg bg-white/10 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
