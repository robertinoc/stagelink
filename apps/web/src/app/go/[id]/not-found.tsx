/**
 * Not-found boundary for /go/[id] routes.
 *
 * Rendered (with HTTP 404) when:
 *   - The smart link ID does not exist
 *   - The smart link is inactive (isActive = false)
 *   - No destination matches the visitor's platform and there is no 'all' catch-all
 *
 * Intentionally simple — no i18n dependency since this route bypasses the
 * intl middleware and has no locale context.
 */
import Link from 'next/link';

export default function SmartLinkNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-5xl font-bold text-zinc-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Link not available</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This link doesn&apos;t have a destination for your device, or it may no longer be active.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
      >
        Go home
      </Link>
    </div>
  );
}
