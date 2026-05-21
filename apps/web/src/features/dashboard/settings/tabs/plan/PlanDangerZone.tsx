import { Bento, BentoLabel } from '@/components/sl/Bento';

interface PlanDangerZoneProps {
  title: string;
  body: string;
  downgradeCta: React.ReactNode;
  cancelCta: React.ReactNode;
}

/**
 * Red bento with the "step down to Pro" + "Cancel plan" actions for the
 * Plan tab. Visually segregated so destructive controls aren't mixed in
 * with the rest of the plan content.
 */
export function PlanDangerZone({ title, body, downgradeCta, cancelCta }: PlanDangerZoneProps) {
  return (
    <Bento
      pad={22}
      className="border-[rgba(255,107,107,0.18)] bg-[rgba(255,107,107,0.04)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 max-w-[640px]">
          <BentoLabel tint="#ff6b6b">{title}</BentoLabel>
          <p className="mt-2 text-[13px] leading-[1.5] text-white/70">{body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {downgradeCta}
          {cancelCta}
        </div>
      </div>
    </Bento>
  );
}

/**
 * Shared visual style for "Cancel plan" + "Disconnect" buttons across the
 * settings tabs so destructive actions are instantly recognisable.
 */
export const RED_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(255,107,107,0.4)] bg-transparent px-4 py-2.5 text-[13px] font-semibold text-[#ff6b6b] transition-opacity cursor-pointer hover:bg-[rgba(255,107,107,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A] disabled:opacity-40 disabled:cursor-not-allowed';
