import Link from 'next/link';

/**
 * Shown to users whose account has been suspended by a platform admin.
 * Lives outside the (app) route group so it renders without AppShell
 * and is reachable without triggering further auth redirects.
 */
export default function SuspendedPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
        >
          <svg
            className="h-6 w-6"
            style={{ color: 'rgba(239,68,68,0.8)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Message */}
        <h1
          className="mb-2 text-lg font-semibold font-[family-name:var(--font-heading)]"
          style={{ color: 'var(--foreground)' }}
        >
          Account unavailable
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Your account is temporarily unavailable.
          <br />
          Please contact StageLink support.
        </p>

        {/* Sign out */}
        <div className="mt-6">
          <Link
            href="/api/auth/signout"
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
