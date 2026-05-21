import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';
import { SubHead } from '@/components/sl/SubHead';
import type { SettingsInvoice } from '@/features/dashboard/settings/settings-data';

interface InvoicesTableProps {
  invoices: SettingsInvoice[];
  title: string;
  hint: string;
  portalCta: string;
  emptyMessage: string;
  paidLabel: string;
  pendingLabel: string;
  dateHeader: string;
  statusHeader: string;
  amountHeader: string;
  pdfHeader: string;
  portalAction?: React.ReactNode;
  pdfAriaLabel: string;
}

/**
 * Invoices table for the Plan tab. The data source (`data.invoices`)
 * starts empty — the table renders the empty state + portal CTA so users
 * can hit the source of truth in Stripe. Wiring real Stripe invoice
 * listings to populate the table is a follow-up.
 */
export function InvoicesTable({
  invoices,
  title,
  hint,
  portalCta,
  emptyMessage,
  paidLabel,
  pendingLabel,
  dateHeader,
  statusHeader,
  amountHeader,
  pdfHeader,
  portalAction,
  pdfAriaLabel,
}: InvoicesTableProps) {
  return (
    <Bento pad={0}>
      <div className="px-6 pb-4 pt-5">
        <SubHead
          title={title}
          hint={hint}
          right={portalAction ?? <Btn variant="outline">{portalCta}</Btn>}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-t border-white/10 px-6 pb-2.5 pt-2 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[1.2px] text-white/30">
        <span>{dateHeader}</span>
        <span>{statusHeader}</span>
        <span>{amountHeader}</span>
        <span className="text-right">{pdfHeader}</span>
      </div>
      {invoices.length === 0 ? (
        <div className="border-t border-white/10 px-6 py-8 text-center text-[13px] text-white/50">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-6 py-3"
            >
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-white">{inv.date}</div>
                <div className="mt-0.5 font-mono text-[11px] text-white/50">{inv.id}</div>
              </div>
              <div>
                {inv.status === 'paid' ? (
                  <Pill tone="green">✓ {paidLabel}</Pill>
                ) : (
                  <Pill tone="yellow">{pendingLabel}</Pill>
                )}
              </div>
              <div className="min-w-[70px] text-right font-[family-name:var(--font-heading)] text-[15px] font-bold tracking-[-0.01em] text-white">
                {inv.amount}
              </div>
              <div className="flex justify-end">
                <a
                  href={inv.pdfUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={pdfAriaLabel}
                  aria-disabled={!inv.pdfUrl}
                  tabIndex={inv.pdfUrl ? 0 : -1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:border-white/20 hover:text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
                >
                  <DownloadIcon />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Bento>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
