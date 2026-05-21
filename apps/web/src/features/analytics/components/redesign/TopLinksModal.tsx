'use client';

// TopLinksModal — full breakdown of every tracked click destination.
//
// Shows a table: Label / Type / Clicks / Share. Above the table, a one-liner
// distribution summary like "65% bloques · 30% redes sociales · 5% smart links"
// derived from the linkItemId prefix + isSmartLink flag.
//
// Opens from the "Ver todos →" button in TopLinksCard. Closes on ✕ button,
// backdrop click, or Esc.

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { TopLink } from '@/lib/api/analytics';

interface CategoryLabels {
  social: string;
  smart: string;
  block: string;
}

interface ModalLabels {
  title: string;
  empty: string;
  closeLabel: string;
  columnLabel: string;
  columnType: string;
  columnClicks: string;
  columnShare: string;
  /** Used to format the summary: `"{social}% redes sociales · {block}% bloques · {smart}% smart links"` */
  summaryTemplate: string;
}

interface TopLinksModalProps {
  open: boolean;
  onClose: () => void;
  links: TopLink[];
  categories: CategoryLabels;
  labels: ModalLabels;
  locale?: 'es' | 'en';
}

type LinkCategory = 'social' | 'smart' | 'block';

function categorize(link: TopLink): LinkCategory {
  if (link.isSmartLink) return 'smart';
  if (link.linkItemId.startsWith('social-')) return 'social';
  return 'block';
}

export function TopLinksModal({
  open,
  onClose,
  links,
  categories,
  labels,
  locale = 'es',
}: TopLinksModalProps) {
  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = links.reduce((s, l) => s + l.clicks, 0);
  const byCategory: Record<LinkCategory, number> = { social: 0, smart: 0, block: 0 };
  links.forEach((l) => {
    byCategory[categorize(l)] += l.clicks;
  });

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const summary = labels.summaryTemplate
    .replace('{social}', String(pct(byCategory.social)))
    .replace('{block}', String(pct(byCategory.block)))
    .replace('{smart}', String(pct(byCategory.smart)));

  const nfClicks = new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-[20px] border border-white/10 bg-[#130F23] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-6 py-5">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
              {labels.title}
            </h2>
            {total > 0 && (
              <p className="mt-1.5 text-[12.5px] text-white/60 leading-relaxed">{summary}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#130F23]"
          >
            <X size={16} />
          </button>
        </header>

        {/* Table */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 92px)' }}>
          {links.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px] text-white/40">{labels.empty}</div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[#130F23]">
                <tr className="border-b border-white/[0.08]">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[1.5px] text-white/40">
                    {labels.columnLabel}
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[1.5px] text-white/40">
                    {labels.columnType}
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[1.5px] text-white/40">
                    {labels.columnClicks}
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-[1.5px] text-white/40">
                    {labels.columnShare}
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((link, i) => {
                  const cat = categorize(link);
                  const share = total > 0 ? Math.round((link.clicks / total) * 100) : 0;
                  const typeLabel = categories[cat];
                  const typeColor =
                    cat === 'social' ? '#00D4FF' : cat === 'smart' ? '#FBBF24' : '#E040FB';
                  return (
                    <tr
                      key={`${link.linkItemId}-${i}`}
                      className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-3 text-[13px] font-medium text-white">
                        {link.label || link.linkItemId}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.5px]"
                          style={{
                            background: `${typeColor}14`,
                            borderColor: `${typeColor}40`,
                            color: typeColor,
                          }}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-[family-name:var(--font-heading)] text-[14px] font-bold text-white">
                        {nfClicks.format(link.clicks)}
                      </td>
                      <td className="px-6 py-3 text-right text-[12px] text-white/60">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
