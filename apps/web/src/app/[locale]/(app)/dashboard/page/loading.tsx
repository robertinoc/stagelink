/**
 * loading.tsx — My Page (page builder) skeleton.
 * Mirrors: header + view-page button + block list area.
 */
export default function PageBuilderLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 rounded bg-white/10" />
          <div className="h-4 w-72 rounded bg-white/[0.06]" />
        </div>
        <div className="h-9 w-28 rounded-lg border border-white/10 bg-white/[0.04]" />
      </div>

      {/* Block list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            {/* Drag handle */}
            <div className="h-5 w-4 rounded bg-white/[0.06] flex-shrink-0" />
            {/* Block icon */}
            <div className="h-8 w-8 rounded-lg bg-white/10 flex-shrink-0" />
            {/* Block label */}
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="h-3 w-48 rounded bg-white/[0.06]" />
            </div>
            {/* Action icons */}
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded bg-white/[0.06]" />
              <div className="h-7 w-7 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>

      {/* Add block button area */}
      <div className="h-10 w-36 rounded-lg bg-white/10" />
    </div>
  );
}
