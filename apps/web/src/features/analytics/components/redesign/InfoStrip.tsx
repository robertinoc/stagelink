'use client';

interface InfoStripProps {
  children: React.ReactNode;
}

export function InfoStrip({ children }: InfoStripProps) {
  return (
    <div
      className="flex items-start gap-2 rounded-[10px] border border-[rgba(0,212,255,0.15)] bg-[rgba(0,212,255,0.06)] px-4 py-3 text-[12px] text-white/70"
      role="note"
    >
      <span aria-hidden="true" className="shrink-0 text-[#00D4FF]">
        ⓘ
      </span>
      <span>{children}</span>
    </div>
  );
}
