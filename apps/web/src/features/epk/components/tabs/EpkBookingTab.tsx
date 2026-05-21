'use client';

// Tab 3 — Booking
// Contacts (booking email, management, press), rider info, and tech requirements.
// NO duplicate of availability notes — that lives in Identity tab.

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { EpkInheritedArtistSnapshot } from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { SubHead } from '@/features/artist/components/SubHead';
import { useIsMobile } from '@/features/artist/hooks/useIsMobile';
import type { EpkFormValues } from '../../schemas/epk.schema';

// ── Field helpers ──────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 6,
        fontFamily: 'var(--font-heading)',
      }}
    >
      {children}
      {required && <span style={{ color: '#E040FB', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4 }}>{message}</p>;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: 'white',
  fontSize: 13.5,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
};

// ── Rider edit dialog ──────────────────────────────────────────────────────────

interface RiderEditDialogProps {
  icon: string;
  title: string;
  description: string;
  placeholder: string;
  value: string;
  disabled: boolean;
  onSave: (value: string) => void;
}

function RiderEditDialog({
  icon,
  title,
  description,
  placeholder,
  value,
  disabled,
  onSave,
}: RiderEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  function handleOpen() {
    setDraft(value);
    setOpen(true);
  }

  function handleSave() {
    onSave(draft);
    setOpen(false);
  }

  const preview = value.trim();
  const previewText = preview ? preview.slice(0, 80) + (preview.length > 80 ? '…' : '') : null;

  return (
    <>
      {/* Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minHeight: 52,
          padding: '10px 14px',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{title}</p>
          {previewText ? (
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: 2,
              }}
            >
              {previewText}
            </p>
          ) : (
            <p
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
                fontStyle: 'italic',
                marginTop: 2,
              }}
            >
              Not set
            </p>
          )}
        </div>
        <Btn size="sm" variant="ghost" type="button" disabled={disabled} onClick={handleOpen}>
          Edit
        </Btn>
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0,0,0,0.7)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: 20,
              background: '#130F23',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'white',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {title}
              </h3>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
            <textarea
              rows={16}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              maxLength={5000}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: 'white',
                fontSize: 13,
                fontFamily: 'monospace',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p
              style={{
                textAlign: 'right',
                fontSize: 11,
                color: draft.length > 4800 ? '#f59e0b' : 'rgba(255,255,255,0.35)',
                marginTop: 4,
                marginBottom: 16,
              }}
            >
              {draft.length.toLocaleString()} / 5,000
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn size="sm" variant="primary" type="button" onClick={handleSave}>
                Save
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface EpkBookingTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  inherited: EpkInheritedArtistSnapshot;
}

export function EpkBookingTab({ form, disabled, inherited }: EpkBookingTabProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Contact info ── */}
      <Bento pad={isMobile ? 16 : 20}>
        <SubHead title="Contacts" hint="Public contacts shown to promoters, press, and bookers" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 14,
          }}
        >
          <div>
            <FieldLabel required>Booking email</FieldLabel>
            <input
              type="email"
              placeholder={inherited.contactEmail ?? 'booking@artist.com'}
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('bookingEmail')}
            />
            <FieldError message={errors.bookingEmail?.message} />
          </div>
          <div>
            <FieldLabel>Management contact</FieldLabel>
            <input
              type="text"
              placeholder="Name / email / phone"
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('managementContact')}
            />
          </div>
          <div>
            <FieldLabel>Press contact</FieldLabel>
            <input
              type="text"
              placeholder="Name / email / phone"
              disabled={disabled}
              style={INPUT_STYLE}
              {...register('pressContact')}
            />
          </div>
        </div>
      </Bento>

      {/* ── Rider & requirements ── */}
      <Bento pad={0}>
        <div style={{ padding: isMobile ? '16px 16px 8px' : '20px 20px 10px' }}>
          <SubHead
            title="Booking info & rider"
            hint="Keep each section clear so promoters know what is logistics, artist-side, and technical. Up to 5,000 characters each."
          />
        </div>

        {/* Table header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Section
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Content
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <RiderEditDialog
              icon="🎤"
              title="Artist requirements"
              description="Hospitality, staff, guest list, catering, dressing room notes, or other artist-side requirements."
              placeholder="e.g. 1 dressing room with lockable door. Guest list: up to 4 people. Catering: water, juice, snacks. No media access to dressing room before the show…"
              value={watch('riderInfo') ?? ''}
              disabled={disabled}
              onSave={(v) => setValue('riderInfo', v, { shouldDirty: true })}
            />
          </div>
          <div>
            <RiderEditDialog
              icon="🎛️"
              title="Technical rider"
              description="DJ setup, mixers, CDJs, sound system, monitors, lights, screens, stage plot, or production notes."
              placeholder={
                'SETUP 01: CDJ+MIXER\n• (1) Pioneer DJM-900 NEXUS\n• (2) Pioneer CDJ-3000\n• (2) Monitor speakers – 1 to 2m from DJ\n\nSETUP 02: TRAKTOR\n• (1) Traktor Kontrol Z1…'
              }
              value={watch('techRequirements') ?? ''}
              disabled={disabled}
              onSave={(v) => setValue('techRequirements', v, { shouldDirty: true })}
            />
          </div>
        </div>
      </Bento>
    </div>
  );
}
