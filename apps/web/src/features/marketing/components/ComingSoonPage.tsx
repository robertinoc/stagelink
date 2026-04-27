import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderItem {
  icon: string;
  label: string;
  description: string;
}

interface ComingSoonPageProps {
  eyebrow: string;
  title: string;
  description: string;
  comingSoon: string;
  backLabel: string;
  backHref: string;
  /** Optional placeholder cards showing the future content structure */
  items?: PlaceholderItem[];
}

/**
 * Shared coming-soon page shell used by /docs and /blog.
 *
 * Future CMS integration points:
 *  - /docs  → replace `items` with real doc categories + link to [slug]/page.tsx
 *  - /blog  → replace `items` with real post cards + link to [slug]/page.tsx
 */
export function ComingSoonPage({
  eyebrow,
  title,
  description,
  comingSoon,
  backLabel,
  backHref,
  items,
}: ComingSoonPageProps) {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-[#0b0b0f]">
      {/* Background radial */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(155,48,208,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(232,121,249,0.08) 0%, transparent 35%)',
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        {/* Eyebrow */}
        <p className="landing-eyebrow mb-5 text-[#9b30d0]">{eyebrow}</p>

        {/* Headline */}
        <h1 className="landing-h2 mb-6 text-white" style={{ maxWidth: '22ch' }}>
          {title}
        </h1>

        {/* Description */}
        <p className="landing-body mx-auto mb-10 text-center text-white/72">{description}</p>

        {/* Coming-soon badge */}
        <div className="mb-16 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60">
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#9b30d0]"
            aria-hidden
          />
          {comingSoon}
        </div>

        {/* Placeholder content grid */}
        {items && items.length > 0 && (
          <div className="mb-16 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-5 opacity-40 select-none"
                aria-hidden
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs leading-relaxed text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Back link */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-white/56 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
