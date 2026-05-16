/**
 * loading.tsx — EPK (Press Kit) page skeleton.
 * Mirrors: header + editor form sections.
 */
export default function EpkLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-white/10" />
          <div className="h-4 w-80 rounded bg-white/[0.06]" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-12 rounded-full bg-white/10" />
          <div className="h-6 w-40 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-t bg-white/10" />
        ))}
      </div>

      {/* Editor form area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
            <div className="h-5 w-36 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-24 w-full rounded-lg bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
