import { ExternalLink } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ArtistRelease, SupportedLocale } from '@stagelink/types';
import { ReleaseCoverImage } from './ReleaseCoverImage';

interface ReleasesSectionProps {
  releases: ArtistRelease[];
  locale: SupportedLocale;
}

/**
 * Extracts the year from a `releaseDate` that is either `YYYY` or `YYYY-MM-DD`.
 * Returns `null` when the value is missing or malformed so the card can drop
 * the date pill entirely instead of rendering "undefined".
 */
function extractYear(releaseDate: string | null): string | null {
  if (!releaseDate) return null;
  const trimmed = releaseDate.trim();
  const match = trimmed.match(/^(\d{4})/);
  return match ? match[1]! : null;
}

/**
 * Public-page "Releases" section.
 *
 * Renders a responsive card grid (1 col on mobile → 2 on sm → 3 on md+) of the
 * artist's EPs, albums, singles, etc. Each card surfaces what's available and
 * silently drops what isn't, so partially-filled entries never render empty
 * placeholders. The section itself returns `null` when the artist has no
 * releases — no empty headers leak onto the landing page.
 */
export async function ReleasesSection({ releases, locale }: ReleasesSectionProps) {
  if (releases.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'public_page.releases' });

  return (
    <section className="space-y-4 print:break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
        {t('title')}
      </h2>

      {/* Mobile: horizontal snap carousel — shows ~2 cards at a time */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:hidden">
        {releases.map((release) => {
          const year = extractYear(release.releaseDate);
          const typeLabel = t(`types.${release.type}`);

          return (
            <article
              key={release.id}
              className="flex w-[44vw] max-w-[176px] flex-none snap-start flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white"
            >
              <ReleaseCoverImage
                coverUrl={release.coverUrl}
                alt={release.title}
                className="aspect-square w-full rounded-xl object-cover"
              />

              <div className="space-y-1 px-0.5">
                <p className="line-clamp-2 text-xs font-semibold leading-snug">{release.title}</p>
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                  {typeLabel}
                  {year ? ` · ${year}` : ''}
                </p>
                {release.label ? (
                  <p className="line-clamp-1 text-[10px] text-zinc-300">{release.label}</p>
                ) : null}
              </div>

              {release.spotifyUrl ? (
                <a
                  href={release.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white transition hover:bg-white/10"
                >
                  Spotify
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          );
        })}
      </div>

      {/* Desktop (sm+): 2-col → 3-col grid */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3">
        {releases.map((release) => {
          const year = extractYear(release.releaseDate);
          const typeLabel = t(`types.${release.type}`);

          return (
            <article
              key={release.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
            >
              <ReleaseCoverImage
                coverUrl={release.coverUrl}
                alt={release.title}
                className="aspect-square w-full rounded-xl object-cover"
              />

              <div className="space-y-1.5 px-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{release.title}</p>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  {typeLabel}
                  {year ? ` · ${year}` : ''}
                </p>
                {release.label ? (
                  <p className="line-clamp-1 text-xs text-zinc-300">{release.label}</p>
                ) : null}
                {release.description ? (
                  <p className="line-clamp-3 pt-1 text-xs leading-relaxed text-zinc-300">
                    {release.description}
                  </p>
                ) : null}
              </div>

              {release.spotifyUrl ? (
                <a
                  href={release.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  {t('listen_on_spotify')}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
