/**
 * loading.tsx — Settings overview page skeleton.
 * Mirrors: header + 5-card overview grid + support banner.
 */
export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-28 rounded bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/[0.06]" />
      </div>

      {/* Settings cards grid */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="space-y-1">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="h-4 w-52 rounded bg-white/[0.06]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-3 w-48 rounded bg-white/[0.06]" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 rounded-full bg-white/10" />
                <div className="h-4 w-4 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support banner */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-2">
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/[0.06]" />
        <div className="h-9 w-32 rounded-lg bg-white/10 mt-1" />
      </div>
    </div>
  );
}
