import ReactMarkdown from 'react-markdown';
import type { TextBlockConfig } from '@stagelink/types';

interface TextBlockRendererProps {
  title: string | null;
  config: TextBlockConfig;
}

export function TextBlockRenderer({ title, config }: TextBlockRendererProps) {
  const hasTitle = Boolean(title?.trim());
  const hasBody = Boolean(config.body?.trim());

  if (!hasTitle && !hasBody) {
    return null;
  }

  return (
    <div className="neon-card-border rounded-[1.5rem] p-[1px]">
      <section className="rounded-[1.4rem] bg-[#0b0614] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        {hasTitle && (
          <h2
            className={`text-sm font-semibold tracking-wide text-zinc-100 ${hasBody ? 'mb-3' : ''}`}
          >
            {title}
          </h2>
        )}
        {hasBody && (
          <div className="bio-prose">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-7 text-zinc-300 last:mb-0 sm:text-base">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-zinc-100">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
                ul: ({ children }) => (
                  <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-zinc-300 sm:text-base">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li className="leading-7">{children}</li>,
              }}
            >
              {config.body}
            </ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}
