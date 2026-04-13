import Link from 'next/link';
import { Globe2, PlayCircle, Radio } from 'lucide-react';
import { DEFAULT_LOCALE, type PublicEpkResponse, type SupportedLocale } from '@stagelink/types';

interface PublicEpkViewProps {
  epk: PublicEpkResponse;
  printMode?: boolean;
  locale?: SupportedLocale;
}

function getMediaIcon(provider: string) {
  switch (provider) {
    case 'soundcloud':
      return Radio;
    case 'youtube':
      return PlayCircle;
    default:
      return Globe2;
  }
}

export function PublicEpkView({
  epk,
  printMode = false,
  locale = DEFAULT_LOCALE,
}: PublicEpkViewProps) {
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
                  {artist.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.avatarUrl}
                      alt={artist.displayName}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white/10 print:ring-zinc-200"
                    />
                  ) : null}
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight print:text-3xl">
                      {artist.displayName}
                    </h1>
                    <p className={`text-sm uppercase tracking-[0.25em] ${mutedHeadingClass}`}>
                      Press kit
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
                  Contacts
                </h2>
                {epk.bookingEmail ? (
                  <p className="text-sm">
                    <span className={`block ${mutedHeadingClass}`}>Booking</span>
                    <a href={`mailto:${epk.bookingEmail}`} className={bodyTextClass}>
                      {epk.bookingEmail}
                    </a>
                  </p>
                ) : null}
                {epk.managementContact ? (
                  <p className="text-sm">
                    <span className={`block ${mutedHeadingClass}`}>Management</span>
                    <span className={bodyTextClass}>{epk.managementContact}</span>
                  </p>
                ) : null}
                {epk.pressContact ? (
                  <p className="text-sm">
                    <span className={`block ${mutedHeadingClass}`}>Press</span>
                    <span className={bodyTextClass}>{epk.pressContact}</span>
                  </p>
                ) : null}
                {epk.location ? (
                  <p className="text-sm">
                    <span className={`block ${mutedHeadingClass}`}>Base</span>
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
                  Bio
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
                  Highlights
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

            {epk.featuredMedia.length > 0 ? (
              <section className="space-y-4">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  Featured media
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {epk.featuredMedia.map((item) => {
                    const MediaIcon = getMediaIcon(item.provider);
                    return (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-2xl border px-4 py-4 transition ${cardClass} hover:border-white/30 print:hover:border-zinc-300`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-full border p-2 ${
                              printMode
                                ? 'border-zinc-300 bg-white text-zinc-700'
                                : 'border-white/10 bg-white/10 text-zinc-200'
                            }`}
                          >
                            <MediaIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${bodyTextClass}`}>{item.title}</p>
                            <p
                              className={`mt-1 text-xs uppercase tracking-[0.18em] ${
                                printMode ? 'text-zinc-600' : 'text-zinc-400'
                              }`}
                            >
                              {item.provider}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {epk.featuredLinks.length > 0 ? (
              <section className="space-y-4">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  Featured links
                </h2>
                <div className="flex flex-wrap gap-3">
                  {epk.featuredLinks.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        printMode
                          ? 'border-zinc-300 bg-white text-zinc-900'
                          : 'border-white/10 bg-white/5'
                      } hover:border-white/30`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {epk.galleryImageUrls.length > 0 ? (
              <section className="space-y-4 print:break-inside-avoid">
                <h2
                  className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedHeadingClass}`}
                >
                  Gallery
                </h2>
                <div className="grid gap-3 md:grid-cols-3 print:grid-cols-2">
                  {epk.galleryImageUrls.map((imageUrl) => (
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

            {epk.riderInfo || epk.techRequirements || epk.availabilityNotes ? (
              <section className="grid gap-4 md:grid-cols-3 print:grid-cols-1">
                {epk.availabilityNotes ? (
                  <div className={`space-y-2 rounded-2xl border p-5 ${cardClass}`}>
                    <h3
                      className={`text-sm font-semibold uppercase tracking-[0.18em] ${mutedHeadingClass}`}
                    >
                      Availability
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
                      Rider
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
                      Tech
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
                <span>Shared via StageLink</span>
                <Link href={`/${locale}/${artist.username}/epk/print`} className="hover:text-white">
                  Open print view
                </Link>
              </footer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
