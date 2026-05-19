'use client';

// GalleryThumb — draggable 16:10 photo thumbnail for the gallery grid.
// Uses @dnd-kit/sortable — must be used inside <SortableContext>.

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@/components/sl/Icon';

interface GalleryThumbProps {
  id: string;
  index: number;
  url: string | null; // null = placeholder
  onReplace: () => void;
  onDelete: () => void;
}

// Pseudo-random gradient seeded by index
function thumbGradient(n: number) {
  const h1 = 260 + n * 12;
  const s1 = 55;
  const l1 = 22 + n * 3;
  const h2 = 280 + n * 8;
  const s2 = 45;
  const l2 = 10 + n * 4;
  return `linear-gradient(135deg, hsl(${h1},${s1}%,${l1}%) 0%, hsl(${h2},${s2}%,${l2}%) 100%)`;
}

const miniBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 6,
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(4px)',
  border: 'none',
  color: 'rgba(255,255,255,0.85)',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
};

export function GalleryThumb({ id, index, url, onReplace, onDelete }: GalleryThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    aspectRatio: '16/10',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    cursor: 'grab',
    background: url ? 'none' : thumbGradient(index),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Actual image */}
      {url && (
        <img
          src={url}
          alt={`Foto ${index + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Subtle inner light on placeholder */}
      {!url && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.06) 0%, transparent 50%)',
          }}
        />
      )}

      {/* Order chip — top left */}
      <span
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          color: 'white',
        }}
      >
        0{index + 1}
      </span>

      {/* Actions — top right */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          display: 'flex',
          gap: 4,
        }}
      >
        <button style={miniBtn} onClick={onReplace} title="Reemplazar foto" type="button">
          <Icon.Upload size={11} />
        </button>
        <button
          style={{ ...miniBtn, color: '#ff6b6b' }}
          onClick={onDelete}
          title="Eliminar foto"
          type="button"
        >
          <Icon.Trash size={11} />
        </button>
      </div>

      {/* Drag handle — bottom left */}
      <button
        style={{ ...miniBtn, position: 'absolute', bottom: 6, left: 6, cursor: 'grab' }}
        {...listeners}
        title="Arrastrar para reordenar"
        type="button"
      >
        <Icon.DragHandle size={11} />
      </button>
    </div>
  );
}
