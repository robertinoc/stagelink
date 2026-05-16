/**
 * loading.tsx — Dashboard home skeleton.
 * Shown by Next.js App Router while the Server Component awaits its data.
 * Mirrors the rough layout of DashboardWelcome:
 *   – welcome header card
 *   – 2×2 (or 3) action card grid
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome header card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-3">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-7 w-56 rounded bg-white/10" />
        <div className="h-4 w-72 rounded bg-white/[0.06]" />
      </div>

      {/* Action cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white/10 flex-shrink-0" />
              <div className="h-5 w-28 rounded bg-white/10" />
            </div>
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-8 w-24 rounded-lg bg-white/10 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
