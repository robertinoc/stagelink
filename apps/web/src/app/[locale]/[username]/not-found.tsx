import Link from 'next/link';

/**
 * Not-found boundary for artist pages.
 *
 * Triggered by notFound() in the Server Component when the backend returns 404.
 * Next.js serves this with a real HTTP 404 status code.
 */
export default function ArtistNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <p className="text-5xl font-bold text-zinc-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-400">
        This artist page doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
