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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      {title && <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-100">{title}</h2>}
      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">{config.body}</p>
    </section>
  );
}
