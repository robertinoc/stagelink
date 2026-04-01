/**
 * Loading skeleton for public artist pages.
 *
 * Shown while the Server Component awaits the backend response.
 * Mirrors the visual structure of ArtistPageView to avoid layout shift.
 */
export default function ArtistPageLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-gradient-to-b from-zinc-900 to-zinc-950">
      {/* Cover skeleton */}
      <div className="h-40 w-full bg-zinc-800 sm:h-56" />

      <div className="mx-auto max-w-md px-4 pb-16">
        {/* Artist header skeleton */}
        <div className="-mt-12 mb-8 flex flex-col items-center">
          <div className="mb-4 h-24 w-24 rounded-full bg-zinc-700 ring-4 ring-zinc-900" />
          <div className="h-6 w-40 rounded bg-zinc-700" />
          <div className="mt-1 h-4 w-24 rounded bg-zinc-800" />
          <div className="mt-3 h-4 w-56 rounded bg-zinc-800" />
        </div>

        {/* Block skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
