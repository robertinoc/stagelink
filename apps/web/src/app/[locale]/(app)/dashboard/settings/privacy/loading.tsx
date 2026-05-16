/**
 * loading.tsx — Settings > Privacy skeleton.
 * Mirrors SettingsSectionShell + PrivacyRightsPanel.
 */
export default function PrivacyLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back breadcrumb */}
      <div className="h-4 w-24 rounded bg-white/[0.06]" />

      {/* Section header */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-white/[0.06]" />
        <div className="h-7 w-36 rounded bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/[0.06]" />
      </div>

      {/* Privacy rights cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-9 w-36 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
