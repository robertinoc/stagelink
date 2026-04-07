import Link from 'next/link';
import type { PublicEpkResponse } from '@stagelink/types';

interface PublicEpkViewProps {
  epk: PublicEpkResponse;
  printMode?: boolean;
}

export function PublicEpkView({ epk, printMode = false }: PublicEpkViewProps) {
  const { artist } = epk;

  return (
    <div className={printMode ? 'bg-white text-zinc-900' : 'min-h-screen bg-zinc-950 text-white'}>
      <div className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 print:rounded-none print:border-0 print:bg-transparent">
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
                    <p className="text-sm uppercase tracking-[0.25em] text-zinc-400 print:text-zinc-500">
                      Press kit
                    </p>
                  </div>
                </div>
                {epk.headline ? (
                  <p className="max-w-3xl text-xl leading-relaxed text-zinc-200 print:text-zinc-700">
                    {epk.headline}
                  </p>
                ) : null}
                {epk.shortBio ? (
                  <p className="max-w-3xl text-base leading-relaxed text-zinc-300 print:text-zinc-700">
                    {epk.shortBio}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5 print:rounded-2xl print:border-zinc-200 print:bg-zinc-50">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400 print:text-zinc-500">
                  Contacts
                </h2>
                {epk.bookingEmail ? (
                  <p className="text-sm">
                    <span className="block text-zinc-500 print:text-zinc-500">Booking</span>
                    <a
                      href={`mailto:${epk.bookingEmail}`}
                      className="text-zinc-100 print:text-zinc-900"
                    >
                      {epk.bookingEmail}
                    </a>
                  </p>
                ) : null}
                {epk.managementContact ? (
                  <p className="text-sm">
                    <span className="block text-zinc-500 print:text-zinc-500">Management</span>
                    <span>{epk.managementContact}</span>
                  </p>
                ) : null}
                {epk.pressContact ? (
                  <p className="text-sm">
                    <span className="block text-zinc-500 print:text-zinc-500">Press</span>
                    <span>{epk.pressContact}</span>
                  </p>
                ) : null}
                {epk.location ? (
                  <p className="text-sm">
                    <span className="block text-zinc-500 print:text-zinc-500">Base</span>
                    <span>{epk.location}</span>
                  </p>
                ) : null}
              </div>
            </header>

            {epk.pressQuote ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 italic text-zinc-100 print:rounded-2xl print:border-zinc-200 print:bg-zinc-50 print:text-zinc-800">
                “{epk.pressQuote}”
              </section>
            ) : null}

            {epk.fullBio ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400 print:text-zinc-500">
                  Bio
                </h2>
                <div className="max-w-4xl whitespace-pre-line text-base leading-8 text-zinc-200 print:text-zinc-800">
                  {epk.fullBio}
                </div>
              </section>
            ) : null}

            {epk.highlights.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400 print:text-zinc-500">
                  Highlights
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {epk.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 print:border-zinc-200 print:bg-transparent print:text-zinc-800"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {epk.featuredMedia.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400 print:text-zinc-500">
                  Featured media
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {epk.featuredMedia.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-white/30 print:border-zinc-200 print:bg-transparent"
                    >
                      <p className="text-sm font-semibold text-white print:text-zinc-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400 print:text-zinc-500">
                        {item.provider}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {epk.featuredLinks.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400 print:text-zinc-500">
                  Featured links
                </h2>
                <div className="flex flex-wrap gap-3">
                  {epk.featuredLinks.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/30 print:border-zinc-300 print:bg-transparent"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {epk.galleryImageUrls.length > 0 ? (
              <section className="space-y-4 print:break-inside-avoid">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400 print:text-zinc-500">
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
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 print:border-zinc-200 print:bg-transparent">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 print:text-zinc-500">
                      Availability
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-7 text-zinc-200 print:text-zinc-800">
                      {epk.availabilityNotes}
                    </p>
                  </div>
                ) : null}
                {epk.riderInfo ? (
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 print:border-zinc-200 print:bg-transparent">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 print:text-zinc-500">
                      Rider
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-7 text-zinc-200 print:text-zinc-800">
                      {epk.riderInfo}
                    </p>
                  </div>
                ) : null}
                {epk.techRequirements ? (
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 print:border-zinc-200 print:bg-transparent">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400 print:text-zinc-500">
                      Tech
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-7 text-zinc-200 print:text-zinc-800">
                      {epk.techRequirements}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!printMode ? (
              <footer className="flex items-center justify-between border-t border-white/10 pt-6 text-xs text-zinc-500">
                <span>Shared via StageLink</span>
                <Link href={`/p/${artist.username}/epk/print`} className="hover:text-white">
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
