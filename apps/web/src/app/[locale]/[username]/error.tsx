'use client';

/**
 * Error boundary for the localized artist page (/[locale]/[username]).
 *
 * Catches errors that propagate from the Server Component — primarily a
 * backend that stays unreachable (TypeError: fetch failed) or returns 5xx/429
 * even after public-api.ts exhausts its retries during a deploy/restart window.
 * Without this boundary those errors surfaced as a raw Next.js crash and spammed
 * Sentry (STAGELINK-WEB-2 / WEB-9). Now the visitor gets a calm "try again"
 * surface; `reset()` re-runs the Server Component, which re-fetches and succeeds
 * once the API is back.
 *
 * Must be a Client Component — Next.js requires error boundaries to be
 * client-side. Static English strings are intentional: the error may occur
 * before the layout sets up the next-intl context, so calling the intl hooks
 * here would risk a second crash inside the boundary itself.
 */
export default function LocalizedArtistError({
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
        We couldn&apos;t load this page. Please try again in a moment.
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
