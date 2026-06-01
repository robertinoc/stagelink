'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { SubHead } from '@/components/sl/SubHead';
import { FieldInput } from '@/components/sl/FieldInput';
import {
  CONSENT_CHANGED_EVENT,
  DEFAULT_CONSENT_PREFERENCES,
  getConsentPreferences,
  rejectNonEssentialConsent,
  setConsentPreferences,
  type ConsentPreferences,
} from '@/lib/analytics/consent';
import { updatePersonalData } from '@/lib/api/privacy';
import type { DashboardSettingsData } from '@/features/dashboard/settings/settings-data';
import { TrustCard } from './privacy/TrustCard';
import { CookieCard } from './privacy/CookieCard';
import { DataUseCard, type DataUseTone } from './privacy/DataUseCard';
import { IntegrationCard, type IntegrationPurposeTone } from './privacy/IntegrationCard';
import { DeleteAccountDialog } from './privacy/DeleteAccountDialog';
import { RED_BUTTON_CLASS } from './plan/PlanDangerZone';

interface PrivacyTabProps {
  data: DashboardSettingsData;
  locale: string;
}

const DATA_USE_KEYS = ['public_page', 'press_kit', 'analytics', 'account'] as const;
const DATA_USE_META: Record<(typeof DATA_USE_KEYS)[number], { icon: string; tone: DataUseTone }> = {
  public_page: { icon: '🌐', tone: 'green' },
  press_kit: { icon: '📰', tone: 'yellow' },
  analytics: { icon: '📊', tone: 'blue' },
  account: { icon: '🔐', tone: 'neutral' },
};

const INTEGRATION_KEYS = ['spotify', 'youtube', 'soundcloud', 'shopify', 'printful'] as const;
const INTEGRATION_TONES: Record<(typeof INTEGRATION_KEYS)[number], IntegrationPurposeTone> = {
  spotify: 'pink',
  youtube: 'pink',
  soundcloud: 'neutral',
  shopify: 'green',
  printful: 'yellow',
};

export function PrivacyTab({ data, locale: _locale }: PrivacyTabProps) {
  void _locale;
  const t = useTranslations('dashboard.settings.privacy_tab');
  const [prefs, setPrefs] = useState<ConsentPreferences>(DEFAULT_CONSENT_PREFERENCES);
  const [firstName, setFirstName] = useState(data.me?.firstName ?? '');
  const [lastName, setLastName] = useState(data.me?.lastName ?? '');
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalStatus, setPersonalStatus] = useState<string | null>(null);
  const [personalTone, setPersonalTone] = useState<'ok' | 'error'>('ok');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setPrefs(getConsentPreferences());
    const onChange = () => setPrefs(getConsentPreferences());
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  const toggleCookie = (key: 'analytics' | 'marketing') => (next: boolean) => {
    const record = setConsentPreferences({ ...prefs, [key]: next });
    setPrefs(record.categories);
  };

  const rejectOptional = () => {
    const record = rejectNonEssentialConsent();
    setPrefs(record.categories);
  };

  const onSavePersonal = async () => {
    setSavingPersonal(true);
    setPersonalStatus(null);
    try {
      await updatePersonalData({ firstName, lastName });
      setPersonalTone('ok');
      setPersonalStatus(t('personal.saved'));
      // Auto-clear the green confirmation after a few seconds.
      window.setTimeout(() => setPersonalStatus(null), 5000);
    } catch (e) {
      setPersonalTone('error');
      setPersonalStatus(e instanceof Error ? e.message : t('personal.error'));
    } finally {
      setSavingPersonal(false);
    }
  };

  const onDownloadExport = () => {
    setExportStatus(t('download.toast'));
    // The export endpoint streams an attachment; navigating triggers the download.
    window.location.href = '/api/privacy/export';
  };

  const email = data.me?.email ?? '';

  return (
    <div className="space-y-5">
      <TrustCard label={t('trust.label')} headline={t('trust.headline')} body={t('trust.body')} />

      {/* COOKIES */}
      <Bento pad={22}>
        <SubHead
          title={t('cookies.title')}
          hint={t('cookies.hint')}
          right={
            <Btn variant="ghost" type="button" onClick={rejectOptional}>
              {t('cookies.reject_cta')}
            </Btn>
          }
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <CookieCard
            label={t('cookies.necessary.label')}
            description={t('cookies.necessary.desc')}
            state="locked"
            lockedLabel={t('cookies.locked')}
            activeLabel={t('cookies.active')}
            inactiveLabel={t('cookies.inactive')}
            switchAriaLabel={t('cookies.necessary.label')}
          />
          <CookieCard
            label={t('cookies.analytics.label')}
            description={t('cookies.analytics.desc')}
            state={prefs.analytics ? 'on' : 'off'}
            onChange={toggleCookie('analytics')}
            lockedLabel={t('cookies.locked')}
            activeLabel={t('cookies.active')}
            inactiveLabel={t('cookies.inactive')}
            switchAriaLabel={t('cookies.analytics.label')}
          />
          <CookieCard
            label={t('cookies.marketing.label')}
            description={t('cookies.marketing.desc')}
            state={prefs.marketing ? 'on' : 'off'}
            onChange={toggleCookie('marketing')}
            lockedLabel={t('cookies.locked')}
            activeLabel={t('cookies.active')}
            inactiveLabel={t('cookies.inactive')}
            switchAriaLabel={t('cookies.marketing.label')}
          />
        </div>
        <p className="mt-3.5 rounded-[10px] border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-[12px] text-white/50">
          {t('cookies.footer_note')}
        </p>
      </Bento>

      {/* DATA USE */}
      <Bento pad={22}>
        <SubHead title={t('data_use.title')} hint={t('data_use.hint')} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {DATA_USE_KEYS.map((key) => {
            const meta = DATA_USE_META[key];
            return (
              <DataUseCard
                key={key}
                icon={meta.icon}
                tone={meta.tone}
                label={t(`data_use.items.${key}.label`)}
                tag={t(`data_use.items.${key}.tag`)}
                description={t(`data_use.items.${key}.desc`)}
              />
            );
          })}
        </div>
      </Bento>

      {/* INTEGRATION TRANSPARENCY */}
      <Bento pad={22}>
        <SubHead title={t('integrations.title')} hint={t('integrations.hint')} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {INTEGRATION_KEYS.map((key) => (
            <IntegrationCard
              key={key}
              name={t(`integrations.items.${key}.name`)}
              purpose={t(`integrations.items.${key}.purpose`)}
              purposeTone={INTEGRATION_TONES[key]}
              description={t(`integrations.items.${key}.desc`)}
              note={t(`integrations.items.${key}.note`)}
            />
          ))}
        </div>
      </Bento>

      {/* PERSONAL DATA */}
      <Bento pad={22}>
        <SubHead title={t('personal.title')} hint={t('personal.hint')} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldInput
            label={t('personal.first_name')}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FieldInput
            label={t('personal.last_name')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <p className="mt-2.5 text-[12px] text-white/50">
          {t.rich('personal.email_note', {
            email,
            strong: (chunks) => <strong className="text-white/80">{chunks}</strong>,
          })}
        </p>
        <div className="mt-3.5">
          <Btn variant="primary" type="button" onClick={onSavePersonal} disabled={savingPersonal}>
            {savingPersonal ? t('personal.saving') : t('personal.save_cta')}
          </Btn>
        </div>
        {personalStatus && (
          <p
            role="status"
            className={
              personalTone === 'ok'
                ? 'mt-2 inline-flex items-center gap-1.5 rounded-[8px] border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.10)] px-3 py-1.5 text-[12px] text-[#4ADE80]'
                : 'mt-2 text-[12px] text-[#ff6b6b]'
            }
          >
            {personalTone === 'ok' && <span aria-hidden="true">✓</span>}
            {personalStatus}
          </p>
        )}
      </Bento>

      {/* DOWNLOAD */}
      <Bento pad={22}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SubHead title={t('download.title')} hint={t('download.hint')} />
          <Btn variant="ghost" type="button" onClick={onDownloadExport} icon={<DownloadIcon />}>
            {t('download.cta')}
          </Btn>
        </div>
        {exportStatus && (
          <p role="status" className="mt-1 text-[12px] text-white/70">
            {exportStatus}
          </p>
        )}
      </Bento>

      {/* DELETE ACCOUNT */}
      <Bento pad={22} className="border-[rgba(255,107,107,0.18)] bg-[rgba(255,107,107,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 max-w-[640px] gap-3">
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(255,107,107,0.3)] bg-[rgba(255,107,107,0.15)] text-base text-[#ff6b6b]"
            >
              ⚠
            </div>
            <div className="min-w-0">
              <BentoLabel tint="#ff6b6b">{t('delete.title')}</BentoLabel>
              <p className="mt-1.5 text-[12.5px] leading-[1.5] text-white/70">
                {t.rich('delete.body', {
                  strong: (chunks) => <strong className="text-[#ff6b6b]">{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={RED_BUTTON_CLASS + ' bg-[rgba(255,107,107,0.12)]'}
          >
            <TrashIcon />
            <span className="ml-1.5">{t('delete.cta')}</span>
          </button>
        </div>
      </Bento>

      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} email={email} />
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
