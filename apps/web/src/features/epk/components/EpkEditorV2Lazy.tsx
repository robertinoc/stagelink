'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { EpkEditorV2 as EpkEditorV2Type } from './EpkEditorV2';

/**
 * Client-side lazy wrapper around `EpkEditorV2`.
 *
 * The editor is a 600+ LOC client component pulling in react-hook-form,
 * dnd-kit, the EPK schema/zod validators, the brand+template engine and
 * every tab editor sub-tree. Loading it eagerly from the EPK page (which
 * is a server component) blew the first-load JS budget for `/dashboard/epk`.
 *
 * Wrapping the dynamic call here lets the server page stay synchronous
 * while the editor itself is code-split into its own chunk. `ssr: false`
 * skips server-render of the editor entirely — it's an editor, the user
 * always interacts before any meaningful paint, so SSR adds zero value.
 *
 * The loading skeleton matches the typical editor frame so the layout
 * shift between skeleton and mount is invisible.
 */
const EpkEditorV2Inner = dynamic(() => import('./EpkEditorV2').then((m) => m.EpkEditorV2), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 p-6">
      <div className="h-12 animate-pulse rounded-2xl bg-white/[0.05]" />
      <div className="h-[640px] animate-pulse rounded-3xl border border-white/8 bg-white/[0.025]" />
    </div>
  ),
});

export function EpkEditorV2Lazy(props: ComponentProps<typeof EpkEditorV2Type>) {
  return <EpkEditorV2Inner {...props} />;
}
