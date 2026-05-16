/**
 * loading.tsx — Analytics page skeleton.
 * Mirrors: range selector bar + 4 summary stat cards + top-links table.
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page title + range selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-white/10" />
          <div className="h-4 w-56 rounded bg-white/[0.06]" />
        </div>
        {/* Range pill placeholders */}
        <div className="flex gap-1 rounded-lg border border-white/10 p-1 self-start">
          {['7d', '30d', '90d', '365d'].map((r) => (
            <div key={r} className="h-7 w-12 rounded bg-white/10" />
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-8 w-16 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Pro trends / top links section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="h-5 w-36 rounded bg-white/10" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded bg-white/10 flex-shrink-0" />
              <div className="h-4 w-40 rounded bg-white/[0.06]" />
            </div>
            <div className="h-4 w-12 rounded bg-white/10" />
            <div className="h-4 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* StageLink Insights placeholder */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="h-5 w-48 rounded bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 p-4 space-y-2">
              <div className="h-4 w-20 rounded bg-white/[0.06]" />
              <div className="h-7 w-14 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
