/**
 * loading.tsx — Profile settings page skeleton.
 * Mirrors: header + avatar upload area + form fields.
 */
export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-24 rounded bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/[0.06]" />
      </div>

      {/* Avatar section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center gap-5">
        <div className="h-20 w-20 rounded-full bg-white/10 flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="h-4 w-48 rounded bg-white/[0.06]" />
          <div className="h-8 w-28 rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Form fields */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="h-5 w-28 rounded bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-20 rounded bg-white/[0.06]" />
              <div className="h-10 w-full rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-20 rounded bg-white/[0.06]" />
          <div className="h-24 w-full rounded-lg bg-white/[0.06]" />
        </div>
      </div>

      {/* Social links section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="h-5 w-24 rounded bg-white/10" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3.5 w-20 rounded bg-white/[0.06]" />
            <div className="h-10 w-full rounded-lg bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <div className="h-10 w-28 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}
