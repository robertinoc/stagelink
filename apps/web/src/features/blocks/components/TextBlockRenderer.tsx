'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { TextBlockConfig } from '@stagelink/types';

interface TextBlockRendererProps {
  title: string | null;
  config: TextBlockConfig;
}

// ─── HTML Embed renderer (sandboxed iframe) ───────────────────────────────────

/**
 * Renders raw HTML (embed codes, widgets, etc.) inside a sandboxed iframe.
 *
 * Security model:
 *   - sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
 *   - No `allow-same-origin` → the iframe's origin is opaque; scripts inside
 *     CANNOT access the parent's DOM, cookies, localStorage, or sessionStorage.
 *   - This protects page visitors even if an artist pastes malicious HTML.
 *
 * Auto-height:
 *   We inject a tiny postMessage relay at the end of the srcdoc. The iframe
 *   posts its scrollHeight whenever it changes (load, resize, DOM mutations).
 *   The parent React component updates iframe height accordingly.
 *   Clamped to [80, 1200] px to prevent abuse.
 */
const AUTO_HEIGHT_SCRIPT = `
<script>
(function() {
  var MIN_H = 80, MAX_H = 1200;
  function send() {
    var h = Math.min(MAX_H, Math.max(MIN_H,
      document.documentElement.scrollHeight || document.body.scrollHeight));
    window.parent.postMessage({ type: 'sl-embed-resize', height: h }, '*');
  }
  window.addEventListener('load', send);
  window.addEventListener('resize', send);
  if (window.MutationObserver) {
    new MutationObserver(send).observe(document.body, {
      subtree: true, childList: true, attributes: true, characterData: true
    });
  }
  send();
})();
</script>
`.trim();

function HtmlEmbedRenderer({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (
      event.data &&
      typeof event.data === 'object' &&
      event.data.type === 'sl-embed-resize' &&
      typeof event.data.height === 'number' &&
      iframeRef.current &&
      event.source === iframeRef.current.contentWindow
    ) {
      setHeight(Math.min(1200, Math.max(80, event.data.height)));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: transparent; overflow-x: hidden; }
  body { padding: 4px; }
  iframe { max-width: 100%; }
</style>
</head>
<body>
${html}
${AUTO_HEIGHT_SCRIPT}
</body>
</html>`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      title="Embed"
      sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
      className="w-full border-0"
      style={{ height, display: 'block' }}
      loading="lazy"
    />
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function TextBlockRenderer({ title, config }: TextBlockRendererProps) {
  const hasTitle = Boolean(title?.trim());
  const hasBody = Boolean(config.body?.trim());

  if (!hasTitle && !hasBody) {
    return null;
  }

  // ── HTML / embed mode ──────────────────────────────────────────────────────
  if (config.htmlMode) {
    return (
      <div className="neon-card-border rounded-[1.5rem] p-[1px]">
        <section className="overflow-hidden rounded-[1.4rem] bg-[#0b0614] shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          {hasTitle && (
            <h2 className="px-5 pb-2 pt-5 text-sm font-semibold tracking-wide text-zinc-100">
              {title}
            </h2>
          )}
          {hasBody && (
            <div className={hasTitle ? 'px-1 pb-1' : 'p-1'}>
              <HtmlEmbedRenderer html={config.body} />
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Markdown mode (default) ────────────────────────────────────────────────
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
