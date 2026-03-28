'use client';

/**
 * Error boundary for artist pages.
 *
 * Catches unexpected errors (5xx from backend, network failures, render errors)
 * without crashing the entire app. Must be a Client Component.
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
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
