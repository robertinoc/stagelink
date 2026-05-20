'use client';

// Tab 3 — Catálogo
// Public counters + record labels (with drag-to-reorder) + releases table

import { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ARTIST_RELEASE_TYPES,
  type ArtistRelease,
  type ArtistReleaseType,
  type RecordLabel,
} from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Pill } from '@/components/sl/SlPrimitives';
import { Icon } from '@/components/sl/Icon';
import { Btn } from '@/components/sl/Btn';
import { SubHead, Chip } from '../SubHead';
import type { ProfileFormValues } from '../../schemas/profile.schema';

// ── Release type pills ────────────────────────────────────────────────
type PillTone = 'pink' | 'blue' | 'neutral' | 'green' | 'yellow';
const RELEASE_TYPE_TONE: Record<ArtistReleaseType, PillTone> = {
  single: 'neutral',
  ep: 'pink',
  album: 'blue',
  remix: 'yellow',
  compilation: 'blue',
  other: 'neutral',
};

const RELEASE_TYPE_LABEL: Record<ArtistReleaseType, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
  remix: 'Remix',
  compilation: 'Compilación',
  other: 'Otro',
};

// ── Gradient for artwork tile seeded by title char code ──────────────
function artworkGradient(title: string) {
  const n = title.charCodeAt(0) % 8;
  return `linear-gradient(135deg, hsl(${250 + n * 12},60%,${18 + n * 2}%) 0%, hsl(${280 + n * 8},50%,${10 + n * 3}%) 100%)`;
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

// ── CURRENT_YEAR / YEAR_OPTIONS ──────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);
const CUSTOM_LABEL = '__custom__';
type DateMode = 'year' | 'full';

function detectDateMode(v: string | null | undefined): DateMode {
  if (!v) return 'year';
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? 'full' : 'year';
}

// ── Draggable label row ───────────────────────────────────────────────
function SortableLabelRow({
  label,
  onEdit,
  onDelete,
}: {
  label: RecordLabel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: label.name,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr auto auto',
        gap: 14,
        padding: '12px 24px',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'grab',
          color: 'rgba(255,255,255,0.30)',
          padding: 0,
        }}
        title="Arrastrar"
      >
        <Icon.DragHandle size={18} />
      </button>

      {/* Logo tile */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: `linear-gradient(135deg, hsl(${label.name.charCodeAt(0) % 360},55%,20%) 0%, hsl(${(label.name.charCodeAt(0) + 60) % 360},45%,12%) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {initials(label.name)}
      </div>

      {/* Name + URL */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label.name}
        </div>
        {label.websiteUrl && (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.50)',
              fontFamily: 'var(--font-heading)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label.websiteUrl}
          </div>
        )}
      </div>

      {/* Edit */}
      <button
        type="button"
        onClick={onEdit}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.50)',
          padding: 4,
        }}
      >
        <Icon.Pencil size={16} />
      </button>
      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#ff6b6b',
          padding: 4,
        }}
      >
        <Icon.Trash size={16} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
interface CatalogTabProps {
  form: UseFormReturn<ProfileFormValues>;
}

export function CatalogTab({ form }: CatalogTabProps) {
  const { watch, setValue } = form;
  const isMobile = useIsMobile();

  const labels = watch('recordLabels') ?? [];
  const releases = watch('releases') ?? [];
  const epsReleasedCount = watch('epsReleasedCount');
  const externalCollabsCount = watch('externalCollabsCount');

  // ── Label modal state ─────────────────────────────────────────────
  const [labelModal, setLabelModal] = useState<{
    mode: 'add' | 'edit';
    idx?: number;
    name: string;
    websiteUrl: string;
  } | null>(null);

  function openAddLabel() {
    setLabelModal({ mode: 'add', name: '', websiteUrl: '' });
  }
  function openEditLabel(idx: number) {
    const l = labels[idx];
    if (!l) return;
    setLabelModal({ mode: 'edit', idx, name: l.name, websiteUrl: l.websiteUrl ?? '' });
  }
  function saveLabel() {
    if (!labelModal?.name.trim()) return;
    const entry: RecordLabel = {
      id: crypto.randomUUID(),
      name: labelModal.name.trim(),
      websiteUrl: labelModal.websiteUrl.trim() || null,
      logoUrl: null,
    };
    if (labelModal.mode === 'add') {
      setValue('recordLabels', [...labels, entry], { shouldDirty: true });
    } else if (labelModal.idx !== undefined) {
      const next = [...labels];
      next[labelModal.idx] = entry;
      setValue('recordLabels', next, { shouldDirty: true });
    }
    setLabelModal(null);
  }
  function deleteLabel(idx: number) {
    setValue(
      'recordLabels',
      labels.filter((_, i) => i !== idx),
      { shouldDirty: true },
    );
  }

  // ── Release modal state ───────────────────────────────────────────
  const [releaseModal, setReleaseModal] = useState<{
    mode: 'add' | 'edit';
    idx?: number;
    title: string;
    type: ArtistReleaseType;
    label: string;
    dateMode: DateMode;
    releaseDate: string;
  } | null>(null);

  function openAddRelease() {
    setReleaseModal({
      mode: 'add',
      title: '',
      type: 'single',
      label: '',
      dateMode: 'year',
      releaseDate: '',
    });
  }
  function openEditRelease(idx: number) {
    const r = releases[idx];
    if (!r) return;
    const dateMode = detectDateMode(r.releaseDate);
    setReleaseModal({
      mode: 'edit',
      idx,
      title: r.title,
      type: r.type,
      label: r.label ?? '',
      dateMode,
      releaseDate: r.releaseDate ?? '',
    });
  }
  function saveRelease() {
    if (!releaseModal?.title.trim()) return;
    const entry: ArtistRelease = {
      id: crypto.randomUUID(),
      title: releaseModal.title.trim(),
      type: releaseModal.type,
      label: releaseModal.label || null,
      releaseDate: releaseModal.releaseDate || null,
      spotifyUrl: null,
      coverUrl: null,
      description: null,
    };
    if (releaseModal.mode === 'add') {
      setValue('releases', [...releases, entry], { shouldDirty: true });
    } else if (releaseModal.idx !== undefined) {
      const next = [...releases];
      next[releaseModal.idx] = entry;
      setValue('releases', next, { shouldDirty: true });
    }
    setReleaseModal(null);
  }
  function deleteRelease(idx: number) {
    setValue(
      'releases',
      releases.filter((_, i) => i !== idx),
      { shouldDirty: true },
    );
  }

  // ── Label dnd ─────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleLabelDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = labels.findIndex((l) => l.name === active.id);
    const newIdx = labels.findIndex((l) => l.name === over.id);
    setValue('recordLabels', arrayMove(labels, oldIdx, newIdx), { shouldDirty: true });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: 'white',
    fontFamily: 'var(--font-heading)',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Counters ─────────────────────────────────────────────────── */}
      <Bento pad={isMobile ? 16 : 22}>
        <SubHead
          title="Contadores públicos"
          hint='Aparecen como "social proof" en tu landing pública. Dejá un campo vacío para ocultarlo.'
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {/* EPs released */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', marginBottom: 6 }}>
              EPs released
            </div>
            <input
              type="number"
              min={0}
              value={epsReleasedCount ?? ''}
              onChange={(e) =>
                setValue(
                  'epsReleasedCount',
                  e.target.value === '' ? null : Number(e.target.value),
                  { shouldDirty: true },
                )
              }
              placeholder="0"
              style={{
                ...inputStyle,
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 700,
              }}
            />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
              Dejá vacío para esconder
            </div>
          </div>

          {/* External collabs */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', marginBottom: 6 }}>
              Colabs externas
            </div>
            <input
              type="number"
              min={0}
              value={externalCollabsCount ?? ''}
              onChange={(e) =>
                setValue(
                  'externalCollabsCount',
                  e.target.value === '' ? null : Number(e.target.value),
                  { shouldDirty: true },
                )
              }
              placeholder="0"
              style={{
                ...inputStyle,
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 700,
              }}
            />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
              Dejá vacío para esconder
            </div>
          </div>

          {/* Record labels — read-only */}
          <div>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>Record labels</div>
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -44,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '3px 7px',
                  borderRadius: 5,
                  background: 'rgba(0,212,255,0.15)',
                  color: '#00D4FF',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                AUTO
              </span>
            </div>
            <div
              style={{
                ...inputStyle,
                fontSize: 26,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.15)',
                cursor: 'default',
              }}
            >
              {labels.length}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
              Auto · calculado de la lista abajo ({labels.length})
            </div>
          </div>
        </div>
      </Bento>

      {/* ── Record labels ─────────────────────────────────────────────── */}
      <Bento pad={0}>
        <div style={{ padding: '20px 24px' }}>
          <SubHead
            title="Record labels"
            hint="Sellos, publishers o imprints donde editaste. Aparecen en tu Press Kit."
            right={
              <Btn
                variant="outline"
                size="sm"
                icon={<Icon.Plus size={13} />}
                onClick={openAddLabel}
              >
                Agregar sello
              </Btn>
            }
          />
        </div>

        {labels.length === 0 ? (
          <div
            style={{
              padding: '20px 24px',
              color: 'rgba(255,255,255,0.30)',
              fontSize: 13,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            No hay sellos aún. Agregá el primero.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleLabelDragEnd}
          >
            <SortableContext
              items={labels.map((l) => l.name)}
              strategy={verticalListSortingStrategy}
            >
              {labels.map((label, idx) => (
                <SortableLabelRow
                  key={label.name}
                  label={label}
                  onEdit={() => openEditLabel(idx)}
                  onDelete={() => deleteLabel(idx)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        {/* last-row bottom border */}
        {labels.length > 0 && <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />}
      </Bento>

      {/* ── Releases ─────────────────────────────────────────────────── */}
      <Bento pad={0}>
        <div style={{ padding: '20px 24px' }}>
          <SubHead
            title="Releases"
            hint="Tu catálogo de lanzamientos. Aparece en tu perfil público y Press Kit."
            right={
              <Btn
                variant="outline"
                size="sm"
                icon={<Icon.Plus size={13} />}
                onClick={openAddRelease}
              >
                Agregar release
              </Btn>
            }
          />
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 90px 80px 60px',
            gap: 14,
            padding: '8px 24px 10px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {['', 'Título · Sello', 'Tipo', 'Año', 'Acciones'].map((h, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.30)',
                textAlign: i === 4 ? 'right' : 'left',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {releases.length === 0 ? (
          <div
            style={{
              padding: '16px 24px',
              color: 'rgba(255,255,255,0.30)',
              fontSize: 13,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            No hay releases aún. Agregá el primero.
          </div>
        ) : (
          releases.map((r, idx) => {
            const year = r.releaseDate ? r.releaseDate.slice(0, 4) : undefined;
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 90px 80px 60px',
                  gap: 14,
                  padding: '10px 24px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  alignItems: 'center',
                }}
              >
                {/* Artwork tile */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: r.coverUrl ? 'none' : artworkGradient(r.title),
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                  }}
                >
                  {r.coverUrl ? (
                    <img
                      src={r.coverUrl}
                      alt={r.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.92)',
                        letterSpacing: '0.3px',
                        lineHeight: 1.1,
                        textAlign: 'center',
                      }}
                    >
                      {r.title.slice(0, 12)}
                      {r.title.length > 12 ? '…' : ''}
                    </span>
                  )}
                </div>

                {/* Title + label */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.title}
                  </div>
                  {r.label && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{r.label}</div>
                  )}
                </div>

                {/* Type pill */}
                <div>
                  <Pill tone={RELEASE_TYPE_TONE[r.type]}>{RELEASE_TYPE_LABEL[r.type]}</Pill>
                </div>

                {/* Year */}
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.70)',
                    fontWeight: 600,
                  }}
                >
                  {year ?? '—'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => openEditRelease(idx)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.60)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon.Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRelease(idx)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: 'rgba(255,107,107,0.08)',
                      border: '1px solid rgba(255,107,107,0.20)',
                      cursor: 'pointer',
                      color: '#ff6b6b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon.Trash size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {releases.length > 0 && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
        )}
      </Bento>

      {/* ── Label modal ───────────────────────────────────────────────── */}
      {labelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#1E1040',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 20,
              padding: 28,
              width: '100%',
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {labelModal.mode === 'add' ? 'Agregar sello' : 'Editar sello'}
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.50)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Nombre *
              </label>
              <input
                type="text"
                value={labelModal.name}
                onChange={(e) => setLabelModal({ ...labelModal, name: e.target.value })}
                placeholder="Nombre del sello"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.50)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                URL (opcional)
              </label>
              <input
                type="url"
                value={labelModal.websiteUrl}
                onChange={(e) => setLabelModal({ ...labelModal, websiteUrl: e.target.value })}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="bare" onClick={() => setLabelModal(null)}>
                Cancelar
              </Btn>
              <Btn variant="primary" onClick={saveLabel} disabled={!labelModal.name.trim()}>
                Guardar
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Release modal ─────────────────────────────────────────────── */}
      {releaseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#1E1040',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 20,
              padding: 28,
              width: '100%',
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {releaseModal.mode === 'add' ? 'Agregar release' : 'Editar release'}
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.50)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Título *
              </label>
              <input
                type="text"
                value={releaseModal.title}
                onChange={(e) => setReleaseModal({ ...releaseModal, title: e.target.value })}
                placeholder="Nombre del release"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.50)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Tipo
                </label>
                <select
                  value={releaseModal.type}
                  onChange={(e) =>
                    setReleaseModal({ ...releaseModal, type: e.target.value as ArtistReleaseType })
                  }
                  style={{ ...inputStyle }}
                >
                  {ARTIST_RELEASE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {RELEASE_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.50)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Fecha
                </label>
                {/* Date mode toggle */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {(['year', 'full'] as DateMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setReleaseModal({ ...releaseModal, dateMode: m, releaseDate: '' })
                      }
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background:
                          releaseModal.dateMode === m
                            ? 'rgba(224,64,251,0.20)'
                            : 'rgba(0,0,0,0.25)',
                        border:
                          releaseModal.dateMode === m
                            ? '1px solid rgba(224,64,251,0.50)'
                            : '1px solid rgba(255,255,255,0.08)',
                        color: releaseModal.dateMode === m ? '#E040FB' : 'rgba(255,255,255,0.60)',
                      }}
                    >
                      {m === 'year' ? 'Año' : 'Fecha completa'}
                    </button>
                  ))}
                </div>
                {releaseModal.dateMode === 'year' ? (
                  <select
                    value={releaseModal.releaseDate}
                    onChange={(e) =>
                      setReleaseModal({ ...releaseModal, releaseDate: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">Elegí un año</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    value={releaseModal.releaseDate}
                    onChange={(e) =>
                      setReleaseModal({ ...releaseModal, releaseDate: e.target.value })
                    }
                    style={inputStyle}
                  />
                )}
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.50)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Sello
              </label>
              {labels.length > 0 ? (
                <>
                  <select
                    value={
                      labels.some((l) => l.name === releaseModal.label)
                        ? releaseModal.label
                        : releaseModal.label
                          ? CUSTOM_LABEL
                          : ''
                    }
                    onChange={(e) => {
                      if (e.target.value === CUSTOM_LABEL) {
                        setReleaseModal({ ...releaseModal, label: releaseModal.label || '' });
                      } else {
                        setReleaseModal({ ...releaseModal, label: e.target.value });
                      }
                    }}
                    style={{ ...inputStyle, marginBottom: 8 }}
                  >
                    <option value="">Sin sello</option>
                    {labels.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                    <option value={CUSTOM_LABEL}>Personalizado…</option>
                  </select>
                  {releaseModal.label && !labels.some((l) => l.name === releaseModal.label) && (
                    <input
                      type="text"
                      value={releaseModal.label}
                      onChange={(e) => setReleaseModal({ ...releaseModal, label: e.target.value })}
                      placeholder="Nombre del sello personalizado"
                      style={inputStyle}
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={releaseModal.label}
                  onChange={(e) => setReleaseModal({ ...releaseModal, label: e.target.value })}
                  placeholder="Nombre del sello"
                  style={inputStyle}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="bare" onClick={() => setReleaseModal(null)}>
                Cancelar
              </Btn>
              <Btn variant="primary" onClick={saveRelease} disabled={!releaseModal.title.trim()}>
                Guardar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
