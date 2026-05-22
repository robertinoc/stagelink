'use client';

// Tab 3 — Booking & rider
// Three sections:
//   1. Booking info & rider — 3 inline collapsibles (availability / artist / tech)
//   2. Career highlights — ★ rows with inline edit/delete
//   3. Record labels — inherited from Profile, shown as chips with colored initials

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { EpkInheritedArtistSnapshot, RecordLabel } from '@stagelink/types';
import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Icon } from '@/components/sl/Icon';
import { SubHead, Chip } from '@/features/artist/components/SubHead';
import { useIsMobile } from '@/features/artist/hooks/useIsMobile';
import { EpkBookingSection } from '../EpkBookingSection';
import { EpkHighlightRow } from '../EpkHighlightRow';
import type { EpkFormValues } from '../../schemas/epk.schema';

interface EpkBookingTabProps {
  form: UseFormReturn<EpkFormValues>;
  disabled: boolean;
  inherited: EpkInheritedArtistSnapshot;
}

export function EpkBookingTab({ form, disabled, inherited }: EpkBookingTabProps) {
  const t = useTranslations('dashboard.epk.editor');
  const { watch, setValue } = form;
  const isMobile = useIsMobile();
  const watchedHighlights = watch('highlights');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Booking info & rider (3 collapsibles) ───────────────────────── */}
      <Bento pad={0}>
        <div style={{ padding: isMobile ? '16px 16px 6px' : '20px 24px 10px' }}>
          <SubHead title={t('bookingTab.riderTitle')} hint={t('bookingTab.riderHint')} />
        </div>

        <EpkBookingSection
          icon="📅"
          title={t('bookingTab.availabilityTitle')}
          description={t('bookingTab.availabilityDesc')}
          placeholder={t('bookingTab.availabilityPlaceholder')}
          value={watch('availabilityNotes') ?? ''}
          locked={disabled}
          onChange={(v) => setValue('availabilityNotes', v, { shouldDirty: true })}
        />
        <EpkBookingSection
          icon="🎤"
          title={t('bookingTab.artistTitle')}
          description={t('bookingTab.artistDesc')}
          placeholder={t('bookingTab.artistPlaceholder')}
          value={watch('riderInfo') ?? ''}
          locked={disabled}
          onChange={(v) => setValue('riderInfo', v, { shouldDirty: true })}
        />
        <EpkBookingSection
          icon="🎛️"
          title={t('bookingTab.techTitle')}
          description={t('bookingTab.techDesc')}
          placeholder={t('bookingTab.techPlaceholder')}
          value={watch('techRequirements') ?? ''}
          locked={disabled}
          last
          onChange={(v) => setValue('techRequirements', v, { shouldDirty: true })}
        />
      </Bento>

      {/* ── Career highlights ───────────────────────────────────────────── */}
      <Bento pad={0}>
        <div style={{ padding: isMobile ? '16px 16px 6px' : '20px 24px 10px' }}>
          <SubHead
            title={t('bookingTab.highlightsTitle')}
            hint={t('bookingTab.highlightsHint')}
            right={
              <>
                <Chip>{watchedHighlights.length}/8</Chip>
                {!disabled && watchedHighlights.length < 8 && (
                  <Btn
                    size="sm"
                    variant="outline"
                    type="button"
                    icon={<Icon.Plus size={12} />}
                    onClick={() =>
                      setValue('highlights', [...watchedHighlights, ''], { shouldDirty: true })
                    }
                  >
                    {t('bookingTab.addHighlight')}
                  </Btn>
                )}
              </>
            }
          />
        </div>

        {watchedHighlights.length === 0 && (
          <div
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>★</div>
            {t('bookingTab.emptyHighlights')}
          </div>
        )}

        {watchedHighlights.map((h, i) => (
          <EpkHighlightRow
            key={`highlight-${i}`}
            value={h}
            locked={disabled}
            last={i === watchedHighlights.length - 1}
            onChange={(next) => {
              const updated = [...watchedHighlights];
              updated[i] = next;
              setValue('highlights', updated, { shouldDirty: true });
            }}
            onRemove={() =>
              setValue(
                'highlights',
                watchedHighlights.filter((_, idx) => idx !== i),
                { shouldDirty: true },
              )
            }
          />
        ))}
      </Bento>

      {/* ── Record labels (inherited from Profile) ──────────────────────── */}
      <Bento
        pad={isMobile ? 16 : 20}
        className="!border-[rgba(0,212,255,0.18)] !bg-[linear-gradient(160deg,rgba(0,212,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(0,212,255,0.15)',
              color: '#00D4FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ↳
          </span>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 15,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.01em',
              }}
            >
              {t('bookingTab.labelsTitle')}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {t('bookingTab.labelsDesc')}
            </div>
          </div>
        </div>

        {inherited.recordLabels.length === 0 ? (
          <div
            style={{
              marginTop: 14,
              padding: '14px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.2)',
              border: '1px dashed rgba(255,255,255,0.1)',
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {t('bookingTab.emptyLabels')}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 16,
            }}
          >
            {inherited.recordLabels.map((label: RecordLabel) => (
              <span
                key={label.id}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: 12.5,
                  color: 'white',
                  fontWeight: 500,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </Bento>
    </div>
  );
}
