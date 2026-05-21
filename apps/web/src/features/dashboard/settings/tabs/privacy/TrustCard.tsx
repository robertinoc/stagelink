import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Glow } from '@/components/sl/SlPrimitives';

interface TrustCardProps {
  label: string;
  headline: string;
  body: string;
}

/**
 * Headline card at the top of the Privacy tab. Magenta-tinted to anchor
 * the tab as a "this is yours, not a mystery" surface.
 */
export function TrustCard({ label, headline, body }: TrustCardProps) {
  return (
    <Bento tone="accent" pad={22}>
      <Glow x="100%" y="0%" size={360} />
      <div className="relative z-[1] flex flex-wrap gap-3.5">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[rgba(224,64,251,0.3)] bg-[rgba(224,64,251,0.15)] text-xl text-[#E040FB]"
        >
          🛡
        </div>
        <div className="min-w-0">
          <BentoLabel tint="#E040FB">{label}</BentoLabel>
          <h3 className="mt-1.5 font-[family-name:var(--font-heading)] text-[22px] font-bold leading-tight tracking-[-0.01em] text-white">
            {headline}
          </h3>
          <p className="mt-2 max-w-[720px] text-[13.5px] leading-[1.55] text-white/70">{body}</p>
        </div>
      </div>
    </Bento>
  );
}
