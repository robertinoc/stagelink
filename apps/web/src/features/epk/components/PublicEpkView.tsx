import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE, type PublicEpkResponse, type SupportedLocale } from '@stagelink/types';

interface PublicEpkViewProps {
  epk: PublicEpkResponse;
  printMode?: boolean;
  locale?: SupportedLocale;
}

export async function PublicEpkView({
  epk,
  printMode = false,
  locale = DEFAULT_LOCALE,
}: PublicEpkViewProps) {
  const t = await getTranslations({ locale, namespace: 'public_epk' });
  const { artist } = epk;

  // ── Style tokens ────────────────────────────────────────────────────────────
  const surfaceClass = printMode
    ? 'border-zinc-200 bg-white text-zinc-900 shadow-sm'
    : 'border-white/10 bg-white/5 text-white';
  const mutedHeadingClass = printMode ? 'text-zinc-500' : 'text-zinc-400';
  const bodyTextClass = printMode ? 'text-zinc-900' : 'text-zinc-200';
  const secondaryBodyTextClass = printMode ? 'text-zinc-800' : 'text-zinc-300';
  const cardClass = printMode
    ? 'border-zinc-200 bg-zinc-50 text-zinc-900'
    : 'border-white/10 bg-white/5 text-white';
  const softCardClass = printMode ? 'border-zinc-200 bg-zinc-50' : 'border-white/10 bg-black/20';

  // ── Derived data ─────────────────────────────────────────────────────────────
  const headerArtistImageUrl = epk.galleryImageUrls[1] ?? artist.avatarUrl;

  // All featured links are shown equally — no "highlighted" concept.
  const allFeaturedLinks = epk.featuredLinks;

  // Strip system slots (hero + portrait) from gallery so they don't repeat.
  let renderableGalleryImages = epk.galleryImageUrls.filter(Boolean);
  if (
    renderableGalleryImages[0] &&
    epk.heroImageUrl &&
    renderableGalleryImages[0] === epk.heroImageUrl
  ) {
    renderableGalleryImages = renderableGalleryImages.slice(1);
  }
  if (
    renderableGalleryImages[0] &&
    headerArtistImageUrl &&
    renderableGalleryImages[0] === headerArtistImageUrl
  ) {
    renderableGalleryImages = renderableGalleryImages.slice(1);
  }

  return (
    <div className={printMode ? 'bg-white text-zinc-900' : 'min-h-screen bg-zinc-950 text-white'}>
      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <div
          className={`overflow-hidden rounded-[32px] border ${surfaceClass} print:rounded-none print:border-0 print:bg-transparent`}
        >
          {/* ── Hero image ── */}
          {epk.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={epk.heroImageUrl}
              alt={artist.displayName}
              className="h-72 w-full object-cover print:h-56"
            />
          ) : null}

          <div className="space-y-10 p-8 print:space-y-8 print:p-0">
            {/* ── Header: identity + contacts ── */}
            <header className="grid gap-8 md:grid-cols-[1.5fr,0.9fr]">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {headerArtistImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={headerArtistImageUrl}
                      alt={artist.displayName}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white/10 print:ring-zinc-200"
                    />
                  ) : null}
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight print:text-3xl">
                      {artist.displayName}
                    </h1>
                    <p className={`text-sm uppercase tracking-[0.25em] ${mutedHeadingClass}`}>
                      {t('title')}
                    </p>
                  </div>
                </div>
                {epk.headline ? (
                  <p className={`max-w-3xl text-xl leading-relaxed ${secondaryBodyTextClass}`}>
                    {epk.headline}
                  </p>
                ) : null}
                {epk.shortBio ? (
                  <p className={`max-w-3xl text-base leading-relaxed ${secondaryBodyTextClass}`}>
                    {epk.shortBio}
                  </p>
                ) : null}
              </div>

              {/* Contacts sidebar */}
              {epk.bookingEmail || epk.managementContact || epk.pressContact || epk.location ? (
                <div
                  className={`space-y-3 rounded-3xl border p-5 ${softCardClass} print:rounded-2xl`}
                >
                  <h2
                    className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                  >
                    {t('sections.contacts')}
                  </h2>
                  {epk.bookingEmail ? (
                    <p className="text-sm">
                      <span className={`block ${mutedHeadingClass}`}>{t('contact.booking')}</span>
                      <a href={`mailto:${epk.bookingEmail}`} className={bodyTextClass}>
                        {epk.bookingEmail}
                      </a>
                    </p>
                  ) : null}
                  {epk.managementContact ? (
                    <p className="text-sm">
                      <span className={`block ${mutedHeadingClass}`}>
                        {t('contact.management')}
                      </span>
                      <span className={bodyTextClass}>{epk.managementContact}</span>
                    </p>
                  ) : null}
                  {epk.pressContact ? (
                    <p className="text-sm">
                      <span className={`block ${mutedHeadingClass}`}>{t('contact.press')}</span>
                      <span className={bodyTextClass}>{epk.pressContact}</span>
                    </p>
                  ) : null}
                  {epk.location ? (
                    <p className="text-sm">
                      <span className={`block ${mutedHeadingClass}`}>{t('contact.base')}</span>
                      <span className={bodyTextClass}>{epk.location}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </header>

            {/* ── Press quote ── */}
            {epk.pressQuote ? (
              <section className={`rounded-3xl border p-6 italic ${cardClass} print:rounded-2xl`}>
                "{epk.pressQuote}"
              </section>
            ) : null}

            {/* ── Full bio ── */}
            {epk.fullBio ? (
              <section className="space-y-3">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.bio')}
                </h2>
                <div
                  className={`max-w-4xl whitespace-pre-line text-base leading-8 ${bodyTextClass}`}
                >
                  {epk.fullBio}
                </div>
              </section>
            ) : null}

            {/* ── Highlights ── */}
            {epk.highlights.length > 0 ? (
              <section className="space-y-4">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.highlights')}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {epk.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className={`rounded-2xl border px-4 py-3 text-sm ${cardClass}`}
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* ── Gallery ── */}
            {renderableGalleryImages.length > 0 ? (
              <section className="space-y-4 print:break-inside-avoid">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.gallery')}
                </h2>
                <div className="grid gap-3 md:grid-cols-3 print:grid-cols-2">
                  {renderableGalleryImages.map((imageUrl) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={imageUrl}
                      src={imageUrl}
                      alt={artist.displayName}
                      className="h-48 w-full rounded-2xl object-cover print:h-40"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {/* ── Links (all equal pills) ── */}
            {allFeaturedLinks.length > 0 ? (
              <section className="space-y-4">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.links')}
                </h2>
                {printMode ? (
                  <div className="space-y-3">
                    {allFeaturedLinks.map((item) => (
                      <div key={item.id} className={`rounded-2xl border px-4 py-3 ${cardClass}`}>
                        <p className={`text-sm font-semibold ${bodyTextClass}`}>{item.label}</p>
                        <p className="mt-1 break-all text-xs text-zinc-600">{item.url}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {allFeaturedLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-fuchsia-300/35 hover:bg-fuchsia-500/10 hover:text-white hover:shadow-[0_0_24px_rgba(168,85,247,0.14)]"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {/* ── Featured media ── */}
            {epk.featuredMedia.length > 0 ? (
              <section className="space-y-4 print:break-inside-avoid">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.featured_media')}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 print:grid-cols-1">
                  {epk.featuredMedia.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`group block rounded-2xl border px-4 py-3 transition ${
                        printMode
                          ? `${cardClass} hover:border-zinc-300`
                          : 'border-white/10 bg-white/[0.04] hover:border-primary/35 hover:bg-primary/[0.05]'
                      }`}
                    >
                      <p className={`truncate text-sm font-medium ${bodyTextClass}`}>
                        {item.title}
                      </p>
                      <p className={`mt-0.5 text-xs ${mutedHeadingClass}`}>
                        {item.provider === 'soundcloud'
                          ? 'SoundCloud'
                          : item.provider === 'youtube'
                            ? 'YouTube'
                            : item.provider.charAt(0).toUpperCase() + item.provider.slice(1)}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {/* ── Record labels ── */}
            {epk.recordLabels ? (
              <section className="space-y-3">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.record_labels')}
                </h2>
                <p className={`text-sm leading-7 ${bodyTextClass}`}>{epk.recordLabels}</p>
              </section>
            ) : null}

            {/* ── Availability / Rider sections ── */}
            {epk.riderInfo || epk.techRequirements || epk.availabilityNotes ? (
              <section className="grid gap-4 md:grid-cols-3 print:grid-cols-1">
                {epk.availabilityNotes ? (
                  <div className={`space-y-2 rounded-2xl border p-5 ${cardClass}`}>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-[0.18em] ${mutedHeadingClass}`}
                    >
                      {t('sections.availability')}
                    </h3>
                    <p className={`whitespace-pre-line text-sm leading-7 ${bodyTextClass}`}>
                      {epk.availabilityNotes}
                    </p>
                  </div>
                ) : null}
                {epk.riderInfo ? (
                  <div className={`space-y-2 rounded-2xl border p-5 ${cardClass}`}>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-[0.18em] ${mutedHeadingClass}`}
                    >
                      {t('sections.artist_requirements')}
                    </h3>
                    <p className={`whitespace-pre-line text-sm leading-7 ${bodyTextClass}`}>
                      {epk.riderInfo}
                    </p>
                  </div>
                ) : null}
                {epk.techRequirements ? (
                  <div className={`space-y-2 rounded-2xl border p-5 ${cardClass}`}>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-[0.18em] ${mutedHeadingClass}`}
                    >
                      {t('sections.technical_rider')}
                    </h3>
                    <p className={`whitespace-pre-line text-sm leading-7 ${bodyTextClass}`}>
                      {epk.techRequirements}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* ── Book CTA ── */}
            {epk.bookingEmail && !printMode ? (
              <section className="flex justify-center">
                <a
                  href={`mailto:${epk.bookingEmail}`}
                  className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.22),rgba(34,211,238,0.12))] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_40px_rgba(120,32,255,0.22)] transition hover:border-fuchsia-300/50 hover:shadow-[0_14px_50px_rgba(120,32,255,0.32)]"
                >
                  {t('book_cta')}
                </a>
              </section>
            ) : null}

            {/* ── Footer ── */}
            {!printMode ? (
              <footer className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500">{t('footer.shared_via')}</p>
                  <a
                    href="https://stagelink.io"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-zinc-400 transition hover:text-white"
                  >
                    {t('footer.create_your_epk')} →
                  </a>
                </div>
                <Link
                  href={`/${locale}/${artist.username}/epk/print`}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  {t('footer.print_view')}
                </Link>
              </footer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
