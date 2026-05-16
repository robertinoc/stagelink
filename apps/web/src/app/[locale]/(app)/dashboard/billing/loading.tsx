/**
 * loading.tsx — Billing page skeleton.
 * Mirrors: header + current plan card + available plans grid + features grid.
 */
export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/[0.06]" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-white/10" />
          <div className="h-6 w-16 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="h-4 w-48 rounded bg-white/[0.06]" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-14 rounded-full bg-white/10" />
            <div className="h-6 w-14 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded bg-white/[0.06]" />
              <div className="h-4 w-12 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Available plans grid */}
      <div className="space-y-3">
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-16 rounded bg-white/10" />
                <div className="h-6 w-14 rounded-full bg-white/10" />
              </div>
              <div className="h-8 w-24 rounded bg-white/10" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 w-full rounded bg-white/[0.06]" />
                ))}
              </div>
              <div className="h-9 w-28 rounded-lg bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Feature highlights grid */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-5 w-16 rounded-full bg-white/10" />
              </div>
              <div className="h-4 w-full rounded bg-white/[0.06]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
