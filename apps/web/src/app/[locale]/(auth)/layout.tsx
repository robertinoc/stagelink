import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for all auth pages (login, signup).
 * Centred card on a muted background with the StageLink wordmark at the top.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark — matches the treatment in Navbar / AppTopbar */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight font-[family-name:var(--font-heading)]"
          >
            <span>Stage</span>
            <span className="text-gradient-brand">Link</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
