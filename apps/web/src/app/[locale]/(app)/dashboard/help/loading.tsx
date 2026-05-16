/**
 * loading.tsx — Help & FAQ page skeleton.
 * Mirrors: icon + title header + 4 FAQ accordion sections.
 */
export default function HelpLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-white/10" />
          <div className="h-6 w-32 rounded bg-white/10" />
        </div>
        <div className="h-4 w-56 rounded bg-white/[0.06]" />
      </div>

      {/* FAQ sections */}
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, sectionIdx) => (
          <div
            key={sectionIdx}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-2"
          >
            <div className="py-4">
              <div className="h-3 w-28 rounded bg-white/[0.06]" />
            </div>
            <div className="space-y-0 divide-y divide-white/[0.06]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="h-4 w-64 rounded bg-white/10" />
                  <div className="h-4 w-4 rounded bg-white/[0.06] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
