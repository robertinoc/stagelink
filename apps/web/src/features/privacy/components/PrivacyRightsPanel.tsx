'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  Globe2,
  Link2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  getConsentPreferences,
  rejectNonEssentialConsent,
  setConsentPreferences,
  type ConsentPreferences,
} from '@/lib/analytics/consent';
import { deleteAccount, updatePersonalData } from '@/lib/api/privacy';

interface PrivacyRightsPanelProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export function PrivacyRightsPanel({ email, firstName, lastName }: PrivacyRightsPanelProps) {
  const t = useTranslations('dashboard.settings.privacy');
  const consentT = useTranslations('privacy.consent');
  const [firstNameValue, setFirstNameValue] = useState(firstName ?? '');
  const [lastNameValue, setLastNameValue] = useState(lastName ?? '');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);
  const [deletedUsername, setDeletedUsername] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [consentPreferences, setConsentPreferenceState] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setConsentPreferenceState(getConsentPreferences());
  }, []);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      await updatePersonalData({
        firstName: firstNameValue,
        lastName: lastNameValue,
      });
      setStatus(t('messages.updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.update_failed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setError(null);
    setStatus(null);
    window.location.href = '/api/privacy/export';
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      const result = await deleteAccount(deleteConfirmation);
      setDeletedUsername(result.deletedUsername);
      setDeleteOpen(false);
      setDeleteSuccessOpen(true);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.delete_failed'));
      setBusy(false);
    }
  }

  function finishDeletedAccountFlow() {
    window.location.href = '/api/auth/signout';
  }

  function updateConsent(nextPreferences: Partial<ConsentPreferences>, message: string) {
    const record = setConsentPreferences({
      ...consentPreferences,
      ...nextPreferences,
      necessary: true,
    });
    setConsentPreferenceState(record.categories);
    setError(null);
    setStatus(message);
  }

  function rejectOptionalConsent() {
    const record = rejectNonEssentialConsent();
    setConsentPreferenceState(record.categories);
    setError(null);
    setStatus(t('consent.saved'));
  }

  const transparencyItems = [
    {
      icon: Globe2,
      title: t('data_use.items.public_profile.title'),
      description: t('data_use.items.public_profile.description'),
      badge: t('labels.public'),
    },
    {
      icon: Eye,
      title: t('data_use.items.epk.title'),
      description: t('data_use.items.epk.description'),
      badge: t('labels.visibility_controlled'),
    },
    {
      icon: BarChart3,
      title: t('data_use.items.analytics.title'),
      description: t('data_use.items.analytics.description'),
      badge: consentPreferences.analytics ? t('labels.on') : t('labels.off'),
    },
    {
      icon: Link2,
      title: t('data_use.items.integrations.title'),
      description: t('data_use.items.integrations.description'),
      badge: t('labels.optional'),
    },
    {
      icon: ShieldCheck,
      title: t('data_use.items.account.title'),
      description: t('data_use.items.account.description'),
      badge: t('labels.private'),
    },
  ];

  const integrationItems = ['spotify', 'youtube', 'soundcloud', 'shopify', 'printful'] as const;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/[0.04]">
        <CardHeader>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>{t('trust.title')}</CardTitle>
              <CardDescription>{t('trust.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <p>{t('trust.points.public_private')}</p>
          <p>{t('trust.points.choice')}</p>
          <p>{t('trust.points.providers')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <SlidersHorizontal className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>{t('consent.title')}</CardTitle>
              <CardDescription>{t('consent.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <ConsentPreferenceRow
              title={consentT('categories.necessary.title')}
              description={consentT('categories.necessary.description')}
              status={t('labels.always_on')}
              active
            />
            <ConsentPreferenceRow
              title={consentT('categories.analytics.title')}
              description={t('consent.analytics_description')}
              status={consentPreferences.analytics ? t('labels.on') : t('labels.off')}
              active={consentPreferences.analytics}
              action={
                <Button
                  type="button"
                  variant={consentPreferences.analytics ? 'outline' : 'default'}
                  size="sm"
                  onClick={() =>
                    updateConsent({ analytics: !consentPreferences.analytics }, t('consent.saved'))
                  }
                >
                  {consentPreferences.analytics ? t('consent.turn_off') : t('consent.turn_on')}
                </Button>
              }
            />
            <ConsentPreferenceRow
              title={consentT('categories.marketing.title')}
              description={t('consent.marketing_description')}
              status={consentPreferences.marketing ? t('labels.on') : t('labels.off')}
              active={consentPreferences.marketing}
              action={
                <Button
                  type="button"
                  variant={consentPreferences.marketing ? 'outline' : 'default'}
                  size="sm"
                  onClick={() =>
                    updateConsent({ marketing: !consentPreferences.marketing }, t('consent.saved'))
                  }
                >
                  {consentPreferences.marketing ? t('consent.turn_off') : t('consent.turn_on')}
                </Button>
              }
            />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{t('consent.note')}</p>
            <Button type="button" variant="outline" onClick={rejectOptionalConsent}>
              {t('consent.reject_optional')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('data_use.title')}</CardTitle>
          <CardDescription>{t('data_use.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {transparencyItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{item.badge}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('integrations.title')}</CardTitle>
          <CardDescription>{t('integrations.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {integrationItems.map((integration) => (
            <div key={integration} className="rounded-lg border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{t(`integrations.items.${integration}.title`)}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t(`integrations.items.${integration}.description`)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t(`integrations.items.${integration}.not_accessed`)}
                  </p>
                </div>
                <Badge variant="outline">{t(`integrations.items.${integration}.status`)}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <UserPen className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>{t('personal.title')}</CardTitle>
              <CardDescription>{t('personal.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleUpdate}>
            <label className="space-y-2 text-sm">
              <span className="font-medium">{t('personal.first_name')}</span>
              <Input value={firstNameValue} onChange={(e) => setFirstNameValue(e.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">{t('personal.last_name')}</span>
              <Input value={lastNameValue} onChange={(e) => setLastNameValue(e.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">{t('personal.email_note', { email })}</p>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>
                {t('personal.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Download className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>{t('export.title')}</CardTitle>
              <CardDescription>{t('export.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={handleExport}>
            {t('export.cta')}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/35">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Trash2 className="mt-1 h-5 w-5 text-destructive" aria-hidden="true" />
            <div>
              <CardTitle>{t('delete.title')}</CardTitle>
              <CardDescription>{t('delete.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('delete.warning')}</p>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            {t('delete.open')}
          </Button>
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('delete.modal_title')}</DialogTitle>
            <DialogDescription>{t('delete.modal_description')}</DialogDescription>
          </DialogHeader>
          <label className="space-y-2 text-sm">
            <span className="font-medium">{t('delete.confirm_label', { email })}</span>
            <Input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="email"
            />
          </label>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('delete.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || deleteConfirmation.trim().toLowerCase() !== email.toLowerCase()}
              onClick={handleDelete}
            >
              {t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteSuccessOpen} onOpenChange={() => undefined}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle>{t('delete.success_title')}</DialogTitle>
            <DialogDescription>
              {deletedUsername
                ? t('delete.success_description', { username: `@${deletedUsername}` })
                : t('delete.success_description_fallback')}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('delete.success_redirect')}</p>
          <DialogFooter>
            <Button type="button" onClick={finishDeletedAccountFlow}>
              {t('delete.success_cta')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ConsentPreferenceRowProps {
  title: string;
  description: string;
  status: string;
  active: boolean;
  action?: ReactNode;
}

function ConsentPreferenceRow({
  title,
  description,
  status,
  active,
  action,
}: ConsentPreferenceRowProps) {
  return (
    <div className="flex min-h-40 flex-col justify-between rounded-lg border border-border/70 p-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">{title}</p>
          <Badge variant={active ? 'secondary' : 'outline'}>{status}</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
