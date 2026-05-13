'use client';

import { useState, type FormEvent } from 'react';
import { Download, Trash2, UserPen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { deleteAccount, updatePersonalData } from '@/lib/api/privacy';

interface PrivacyRightsPanelProps {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export function PrivacyRightsPanel({ email, firstName, lastName }: PrivacyRightsPanelProps) {
  const t = useTranslations('dashboard.settings.privacy');
  const [firstNameValue, setFirstNameValue] = useState(firstName ?? '');
  const [lastNameValue, setLastNameValue] = useState(lastName ?? '');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      await deleteAccount(deleteConfirmation);
      window.location.href = '/api/auth/signout';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.delete_failed'));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}
