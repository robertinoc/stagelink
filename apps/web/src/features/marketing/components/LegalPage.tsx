import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export interface LegalSection {
  heading: string;
  /** One or more paragraphs of body copy. */
  body: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  /** Localized "Last updated: …" line. */
  lastUpdatedLabel: string;
  /**
   * Draft notice shown in a prominent banner. These pages are scaffolding:
   * the content is a structural first draft and is NOT a substitute for the
   * lawyer-reviewed copy that replaces it before public launch.
   */
  reviewNotice: string;
  sections: LegalSection[];
  backLabel: string;
  backHref: string;
}

/**
 * Shared layout for the legal pages (/privacy, /terms, /cookie-policy).
 *
 * Intentionally a thin, content-agnostic shell so the final lawyer-reviewed copy
 * is a drop-in replacement of the i18n `legal` sections — no build work needed.
 * All three routes set `robots: { index: false }` until the copy is approved.
 */
export function LegalPage({
  eyebrow,
  title,
  lastUpdatedLabel,
  reviewNotice,
  sections,
  backLabel,
  backHref,
}: LegalPageProps) {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-[#0b0b0f]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(155,48,208,0.14) 0%, transparent 55%)',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-20">
        <p className="landing-eyebrow mb-4 text-[#9b30d0]">{eyebrow}</p>
        <h1 className="landing-h2 mb-3 text-white">{title}</h1>
        <p className="mb-8 text-sm text-white/52">{lastUpdatedLabel}</p>

        {/* Draft / pending legal review banner */}
        <div className="mb-12 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <p className="text-sm leading-relaxed text-amber-100/80">{reviewNotice}</p>
        </div>

        <div className="flex flex-col gap-10">
          {sections.map((section, i) => (
            <div key={`${i}-${section.heading}`} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
              {section.body.map((paragraph, j) => (
                <p key={j} className="landing-body text-white/72">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/8 pt-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/56 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
