'use client';

/**
 * Error boundary for artist pages.
 *
 * Handles unexpected server errors (5xx) that propagate from the Server Component.
 * Must be a Client Component — Next.js requires error boundaries to be client-side.
 *
 * Note: Does not use next-intl here since the error may occur before the layout
 * has a chance to set up the intl context. Static English strings are intentional.
 */
export default function ArtistError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-5xl font-bold text-zinc-600">:(</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-400">
        We couldn&apos;t load this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
      >
        Try again
      </button>
    </div>
  );
}
