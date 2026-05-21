import { Btn } from '@/components/sl/Btn';
import { cn } from '@/lib/utils';

export interface TierCardData {
  id: 'free' | 'pro' | 'pro_plus';
  name: string;
  price: string;
  sub: string;
  features: string[];
  popular?: boolean;
}

interface TierCardProps {
  tier: TierCardData;
  isCurrent: boolean;
  ctaLabel: string;
  currentLabel: string;
  popularLabel: string;
  /** Pre-built form action button. Rendered as the CTA when provided. */
  ctaAction?: React.ReactNode;
}

/**
 * Single tier card in the Plan tab. Current plan gets the magenta border +
 * glow + "Plan actual" pill; popular non-current gets the "POPULAR" pill +
 * gradient primary CTA. Everything else is the idle ghost variant.
 */
export function TierCard({
  tier,
  isCurrent,
  ctaLabel,
  currentLabel,
  popularLabel,
  ctaAction,
}: TierCardProps) {
  return (
    <article
      className={cn(
        'relative flex flex-col rounded-2xl border p-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        isCurrent
          ? 'border-[1.5px] border-[#E040FB] bg-[linear-gradient(160deg,rgba(224,64,251,0.10)_0%,rgba(74,26,140,0.04)_100%)] shadow-[0_0_32px_rgba(224,64,251,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]'
          : 'border-white/10 bg-black/25',
      )}
    >
      <TopRightPill
        isCurrent={isCurrent}
        popular={Boolean(tier.popular)}
        currentLabel={currentLabel}
        popularLabel={popularLabel}
      />
      <h4 className="font-[family-name:var(--font-heading)] text-[22px] font-bold tracking-[-0.02em] text-white">
        {tier.name}
      </h4>
      <p className="mt-1 text-[12px] leading-[1.4] text-white/50">{tier.sub}</p>
      <div className="mb-[18px] mt-4 flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-heading)] text-[38px] font-bold leading-none text-white">
          {tier.price}
        </span>
        <span className="text-[13px] text-white/50">/mes</span>
      </div>
      <ul className="flex flex-col gap-2 pl-0" role="list">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13px] leading-[1.4] text-white/70">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[rgba(224,64,251,0.15)] text-[10px] font-bold text-[#E040FB]"
            >
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        {ctaAction ?? (
          <Btn
            variant={isCurrent ? 'outline' : tier.popular ? 'primary' : 'ghost'}
            full
            disabled={isCurrent}
            aria-disabled={isCurrent}
            style={isCurrent ? { cursor: 'default' } : undefined}
          >
            {isCurrent ? currentLabel : ctaLabel}
          </Btn>
        )}
      </div>
    </article>
  );
}

function TopRightPill({
  isCurrent,
  popular,
  currentLabel,
  popularLabel,
}: {
  isCurrent: boolean;
  popular: boolean;
  currentLabel: string;
  popularLabel: string;
}) {
  if (isCurrent) {
    return (
      <span className="absolute right-[14px] top-[14px] inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.15)] px-2 py-1 text-[10px] font-bold tracking-[0.5px] text-[#4ADE80]">
        <span aria-hidden="true">●</span>
        {currentLabel}
      </span>
    );
  }
  if (popular) {
    return (
      <span className="absolute right-[14px] top-[14px] rounded-full bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)] px-2.5 py-1 text-[10px] font-bold tracking-[0.5px] text-white shadow-[0_0_18px_rgba(224,64,251,0.45)]">
        {popularLabel}
      </span>
    );
  }
  return null;
}
