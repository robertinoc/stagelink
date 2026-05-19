'use client';

// MarkdownEditor — Write / Preview toggle with simple toolbar.
// Supports **bold**, _italic_, * list items, paragraphs (\\n\\n), # headings, > quotes.

import { useState } from 'react';
import { Icon } from '@/components/sl/Icon';

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const htmlLines: string[] = [];
  let inList = false;

  for (const raw of lines) {
    let line = raw;
    // heading
    if (line.startsWith('# ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(
        `<h3 style="font-size:15px;font-weight:700;margin:10px 0 4px;color:#fff">${esc(line.slice(2))}</h3>`,
      );
      continue;
    }
    // blockquote
    if (line.startsWith('> ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(
        `<blockquote style="border-left:2px solid rgba(224,64,251,0.5);margin:6px 0;padding:2px 12px;color:rgba(255,255,255,0.6)">${inlineFormat(line.slice(2))}</blockquote>`,
      );
      continue;
    }
    // list item
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        htmlLines.push('<ul style="margin:6px 0;padding-left:20px;list-style:disc">');
        inList = true;
      }
      htmlLines.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }
    // close list
    if (inList && line.trim() !== '') {
      htmlLines.push('</ul>');
      inList = false;
    }
    // blank line = paragraph break
    if (line.trim() === '') {
      htmlLines.push('<br/>');
      continue;
    }
    htmlLines.push(`<p style="margin:0 0 2px">${inlineFormat(line)}</p>`);
  }
  if (inList) htmlLines.push('</ul>');
  return htmlLines.join('');
}

function inlineFormat(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type Mode = 'write' | 'preview';

const TOOLBAR_BUTTONS: { icon: React.ReactNode; title: string; action: (sel: string) => string }[] =
  [
    { icon: <Icon.Bold size={14} />, title: 'Negrita', action: (s) => `**${s || 'texto'}**` },
    { icon: <Icon.Italic size={14} />, title: 'Cursiva', action: (s) => `_${s || 'texto'}_` },
    { icon: <Icon.List size={14} />, title: 'Lista', action: (s) => `* ${s || 'ítem'}` },
    { icon: <Icon.Heading size={14} />, title: 'Título', action: (s) => `# ${s || 'título'}` },
    { icon: <Icon.Quote size={14} />, title: 'Cita', action: (s) => `> ${s || 'cita'}` },
    { icon: <Icon.Link size={14} />, title: 'Link', action: (s) => `[${s || 'texto'}](url)` },
  ];

export function MarkdownEditor({
  value,
  onChange,
  rows = 5,
  maxLength,
  disabled,
  placeholder,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<Mode>('write');

  const handleToolbar = (action: (s: string) => string) => {
    const ta = document.activeElement as HTMLTextAreaElement | null;
    if (!ta || ta.tagName !== 'TEXTAREA') {
      onChange(value + action(''));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end);
    const replacement = action(sel);
    onChange(value.slice(0, start) + replacement + value.slice(end));
    // restore focus after state update
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + replacement.length, start + replacement.length);
    });
  };

  const len = value.length;
  const overLimit = maxLength ? len > maxLength : false;

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: `1px solid ${overLimit ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '6px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          flexWrap: 'wrap',
        }}
      >
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.title}
            title={btn.title}
            type="button"
            disabled={disabled || mode === 'preview'}
            onClick={() => handleToolbar(btn.action)}
            style={{
              width: 28,
              height: 26,
              borderRadius: 6,
              background: 'transparent',
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.50)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)')
            }
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            {btn.icon}
          </button>
        ))}

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            padding: 3,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            gap: 2,
          }}
        >
          {(['write', 'preview'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {m === 'write' ? '✎ Escribir' : '👁 Preview'}
            </button>
          ))}
        </div>

        {/* Char counter */}
        {maxLength && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: overLimit ? '#ff6b6b' : 'rgba(255,255,255,0.35)',
              fontWeight: overLimit ? 700 : 400,
              marginLeft: 6,
            }}
          >
            {len}/{maxLength}
          </span>
        )}
      </div>

      {/* Write mode */}
      {mode === 'write' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontFamily: 'var(--font-body)',
            fontSize: 13.5,
            lineHeight: 1.65,
            resize: 'vertical',
            minHeight: rows * 24 + 32,
          }}
        />
      )}

      {/* Preview mode */}
      {mode === 'preview' && (
        <div
          style={{
            padding: '16px 18px',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.70)',
            minHeight: rows * 24 + 32,
          }}
          // Safe: renderMarkdown only produces controlled HTML from user's own text
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(value) || '<span style="opacity:0.3">Sin contenido aún.</span>',
          }}
        />
      )}
    </div>
  );
}
