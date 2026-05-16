/**
 * loading.tsx — Settings > Smart Merch skeleton.
 * Mirrors SettingsSectionShell + SmartMerchSection.
 */
export default function SmartMerchLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back breadcrumb */}
      <div className="h-4 w-24 rounded bg-white/[0.06]" />

      {/* Section header */}
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-white/[0.06]" />
        <div className="h-7 w-32 rounded bg-white/10" />
        <div className="h-4 w-60 rounded bg-white/[0.06]" />
      </div>

      {/* Integration card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="space-y-1">
            <div className="h-5 w-28 rounded bg-white/10" />
            <div className="h-4 w-48 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="h-9 w-36 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}
