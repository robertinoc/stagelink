import Link from 'next/link';
import { Globe2 } from 'lucide-react';
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
  const headerArtistImageUrl = epk.galleryImageUrls[1] ?? artist.avatarUrl;
  const highlightedLink = epk.featuredLinks[0] ?? null;
  const featuredLinks = highlightedLink ? epk.featuredLinks.slice(1) : epk.featuredLinks;
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
          {epk.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={epk.heroImageUrl}
              alt={artist.displayName}
              className="h-72 w-full object-cover print:h-56"
            />
          ) : null}

          <div className="space-y-10 p-8 print:space-y-8 print:p-0">
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
                    <span className={`block ${mutedHeadingClass}`}>{t('contact.management')}</span>
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
            </header>

            {epk.pressQuote ? (
              <section className={`rounded-3xl border p-6 italic ${cardClass} print:rounded-2xl`}>
                “{epk.pressQuote}”
              </section>
            ) : null}

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

            {highlightedLink ? (
              <section className="space-y-4">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.highlighted_link')}
                </h2>
                <a
                  href={highlightedLink.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group block rounded-2xl border px-4 py-4 transition ${
                    printMode
                      ? `${cardClass} hover:border-zinc-300`
                      : 'border-fuchsia-400/25 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(34,211,238,0.1))] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_48px_rgba(120,32,255,0.18)] hover:border-fuchsia-300/45 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_22px_60px_rgba(120,32,255,0.24)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full border p-2 ${
                        printMode
                          ? 'border-zinc-300 bg-white text-zinc-700'
                          : 'border-white/15 bg-black/20 text-fuchsia-100 shadow-[0_0_20px_rgba(168,85,247,0.18)]'
                      }`}
                    >
                      <Globe2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${bodyTextClass}`}>
                        {highlightedLink.label}
                      </p>
                      <p
                        className={`mt-1 break-all text-xs ${
                          printMode ? 'text-zinc-700' : 'text-zinc-200/80'
                        }`}
                      >
                        {highlightedLink.url}
                      </p>
                    </div>
                  </div>
                </a>
              </section>
            ) : null}

            {featuredLinks.length > 0 ? (
              <section className="space-y-4">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  {t('sections.featured_links')}
                </h2>
                {printMode ? (
                  <div className="space-y-3">
                    {featuredLinks.map((item) => (
                      <div key={item.id} className={`rounded-2xl border px-4 py-3 ${cardClass}`}>
                        <p className={`text-sm font-semibold ${bodyTextClass}`}>{item.label}</p>
                        <p className="mt-1 break-all text-xs text-zinc-700">{item.url}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {featuredLinks.map((item) => (
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

            {!printMode ? (
              <footer className="flex items-center justify-between border-t border-white/10 pt-6 text-xs text-zinc-500">
                <span>{t('footer.shared_via')}</span>
                <Link href={`/${locale}/${artist.username}/epk/print`} className="hover:text-white">
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
