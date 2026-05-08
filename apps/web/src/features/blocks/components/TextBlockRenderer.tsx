import type { TextBlockConfig } from '@stagelink/types';

interface TextBlockRendererProps {
  title: string | null;
  config: TextBlockConfig;
}

export function TextBlockRenderer({ title, config }: TextBlockRendererProps) {
  if (!config.body?.trim()) {
    return null;
  }

  return (
    <div className="neon-card-border rounded-[1.5rem] p-[1px]">
      <section className="rounded-[1.4rem] bg-[#0b0614] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        {title && (
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-100">{title}</h2>
        )}
        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{config.body}</p>
      </section>
    </div>
  );
}
