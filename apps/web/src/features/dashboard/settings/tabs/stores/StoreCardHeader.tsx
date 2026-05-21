import { Pill } from '@/components/sl/SlPrimitives';

interface StoreCardHeaderProps {
  name: string;
  brand: string;
  emoji: string;
  title: string;
  hint: string;
  connected: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
}

/**
 * Header strip shared by Shopify + Printful cards. Same shape as the
 * Connection card header but without a "last sync" timestamp.
 */
export function StoreCardHeader({
  name,
  brand,
  emoji,
  title,
  hint,
  connected,
  connectedLabel,
  disconnectedLabel,
}: StoreCardHeaderProps) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5"
      style={{
        background: `radial-gradient(ellipse 60% 100% at 0% 0%, ${brand}1a 0%, transparent 60%)`,
      }}
    >
      <div className="flex min-w-0 gap-3.5">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border text-xl"
          style={{ background: `${brand}18`, borderColor: `${brand}44` }}
        >
          {emoji}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
              {name}
            </h3>
            {connected ? (
              <Pill tone="green">● {connectedLabel}</Pill>
            ) : (
              <Pill tone="neutral">{disconnectedLabel}</Pill>
            )}
          </div>
          <p className="mt-1 text-[12px] text-white/50">
            <strong className="text-white/70">{title}</strong> · {hint}
          </p>
        </div>
      </div>
    </div>
  );
}
