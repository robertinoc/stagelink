'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  artistUsernames: string[];
  isSuspended: boolean;
  createdAt: string;
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; users: AdminUser[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function truncateId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function matchesSearch(user: AdminUser, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    user.email.toLowerCase().includes(q) ||
    (user.name?.toLowerCase().includes(q) ?? false) ||
    (user.firstName?.toLowerCase().includes(q) ?? false) ||
    (user.lastName?.toLowerCase().includes(q) ?? false) ||
    user.artistUsernames.some((h) => h.toLowerCase().includes(q))
  );
}

// ─── Shared field ─────────────────────────────────────────────────────────────

function Dash() {
  return <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>;
}

function ModalField({
  label,
  id,
  value,
  onChange,
  placeholder,
  readOnly,
  hint,
}: {
  label: string;
  id: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium"
        style={{ color: readOnly ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)' }}
      >
        {label}
        {readOnly && (
          <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            (read-only)
          </span>
        )}
      </label>
      <input
        id={id}
        type="text"
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2"
        style={{
          backgroundColor: readOnly ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${readOnly ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
          color: readOnly ? 'rgba(255,255,255,0.35)' : 'var(--foreground)',
          cursor: readOnly ? 'not-allowed' : undefined,
        }}
      />
      {hint && (
        <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Loading / error / empty rows ─────────────────────────────────────────────

function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-3 animate-pulse rounded"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  width: j === 0 ? '6rem' : j === 3 ? '10rem' : '5rem',
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ErrorRow({ message, cols }: { message: string; cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-4 py-10 text-center text-sm"
        style={{ color: 'rgba(255,80,80,0.8)' }}
      >
        {message}
      </td>
    </tr>
  );
}

function EmptyRow({ cols, query }: { cols: number; query: string }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-4 py-10 text-center text-sm"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        {query ? `No users matching "${query}".` : 'No users found.'}
      </td>
    </tr>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isAdmin,
  onStatusChange,
  onEdit,
  onDelete,
  onManageAccess,
}: {
  user: AdminUser;
  isAdmin: boolean;
  onStatusChange: (id: string, isSuspended: boolean) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onManageAccess: (user: AdminUser, grant: boolean) => void;
}) {
  const handle = user.artistUsernames[0] ?? null;
  const [suspending, setSuspending] = useState(false);

  async function toggleSuspend() {
    setSuspending(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: !user.isSuspended }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        alert(body.message ?? 'Could not update user status.');
        return;
      }
      const { user: updated } = (await res.json()) as { user: AdminUser };
      onStatusChange(user.id, updated.isSuspended);
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSuspending(false);
    }
  }

  return (
    <tr
      className="transition-colors"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      <td className="px-4 py-3">
        <code
          className="rounded px-1.5 py-0.5 text-xs"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          title={user.id}
        >
          {truncateId(user.id)}
        </code>
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {handle ? <span style={{ color: 'var(--foreground)' }}>@{handle}</span> : <Dash />}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)' }}>
        {user.name ?? <Dash />}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {user.email}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {formatDate(user.createdAt)}
      </td>

      <td className="px-4 py-3">
        {isAdmin ? (
          <Badge
            variant="outline"
            className="border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 text-xs"
          >
            Admin
          </Badge>
        ) : (
          <Dash />
        )}
      </td>

      <td className="px-4 py-3">
        {user.isSuspended ? (
          <Badge variant="destructive">suspended</Badge>
        ) : (
          <Badge variant="secondary">active</Badge>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={suspending}
            onClick={toggleSuspend}
            className={
              user.isSuspended
                ? 'text-green-400 hover:text-green-300'
                : 'text-yellow-400 hover:text-yellow-300'
            }
          >
            {suspending ? '…' : user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </Button>
          {isAdmin ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManageAccess(user, false)}
              className="text-fuchsia-400 hover:text-fuchsia-300"
            >
              Revoke
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManageAccess(user, true)}
              className="text-fuchsia-400 hover:text-fuchsia-300"
            >
              Admin
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (updated: AdminUser) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not save changes.');
        return;
      }

      const { user: updated } = (await res.json()) as { user: AdminUser };
      onSaved(updated);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h3 className="mb-4 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          Edit user
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <ModalField
            id="edit-first"
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="First name"
          />
          <ModalField
            id="edit-last"
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Last name"
          />
          <ModalField
            id="edit-email"
            label="Email"
            value={user.email}
            readOnly
            hint="Managed by WorkOS — changes here would desync identity."
          />
          <ModalField
            id="edit-handle"
            label="Handle"
            value={user.artistUsernames[0] ? `@${user.artistUsernames[0]}` : '—'}
            readOnly
            hint="Immutable in V1."
          />

          {error && (
            <p className="text-xs" style={{ color: 'rgba(255,80,80,0.9)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUser;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });

      if (res.status === 204) {
        onDeleted(user.id);
        onClose();
        return;
      }

      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? 'Could not delete user.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
        >
          <svg
            className="h-5 w-5"
            style={{ color: 'rgba(239,68,68,0.8)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h3
          className="mb-1 text-center text-base font-semibold"
          style={{ color: 'var(--foreground)' }}
        >
          Delete user?
        </h3>
        <p className="mb-1 text-center text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <strong style={{ color: 'var(--foreground)' }}>{user.name ?? user.email}</strong>
        </p>
        <p className="mb-5 text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          This is a soft delete — the user&apos;s data is preserved but they lose access
          immediately. Their WorkOS identity remains active (hard delete deferred to V2).
        </p>

        {error && (
          <p className="mb-3 text-center text-xs" style={{ color: 'rgba(255,80,80,0.9)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin access modal ───────────────────────────────────────────────────────

function AdminAccessModal({
  user,
  grant,
  onClose,
}: {
  user: AdminUser;
  grant: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function copyEmail() {
    void navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(168,85,247,0.12)' }}
        >
          <svg
            className="h-5 w-5"
            style={{ color: 'rgba(168,85,247,0.8)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z"
            />
          </svg>
        </div>

        <h3
          className="mb-1 text-center text-base font-semibold"
          style={{ color: 'var(--foreground)' }}
        >
          {grant ? 'Grant Behind the Stage access' : 'Revoke Behind the Stage access'}
        </h3>

        <p className="mb-5 text-center text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Admin access is controlled by the{' '}
          <code
            className="rounded px-1 py-0.5 text-xs"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
          >
            BEHIND_ADMIN_EMAILS
          </code>{' '}
          environment variable in Vercel.
        </p>

        <div
          className="mb-4 rounded-lg p-4 space-y-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Steps
          </p>
          <ol className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <li className="flex gap-2">
              <span style={{ color: 'rgba(168,85,247,0.7)' }}>1.</span>
              <span>Copy this email address:</span>
            </li>
          </ol>

          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded-md px-3 py-2 text-sm truncate"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--foreground)',
              }}
            >
              {user.email}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyEmail}
              className={copied ? 'text-green-400' : undefined}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <ol className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }} start={2}>
            <li className="flex gap-2">
              <span style={{ color: 'rgba(168,85,247,0.7)' }}>2.</span>
              <span>
                Go to{' '}
                <strong style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Vercel → Project Settings → Environment Variables
                </strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: 'rgba(168,85,247,0.7)' }}>3.</span>
              {grant ? (
                <span>
                  {' '}
                  Add the email to{' '}
                  <code
                    className="rounded px-1 py-0.5 text-xs"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    BEHIND_ADMIN_EMAILS
                  </code>{' '}
                  (comma-separated if multiple)
                </span>
              ) : (
                <span>
                  Remove the email from{' '}
                  <code
                    className="rounded px-1 py-0.5 text-xs"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    BEHIND_ADMIN_EMAILS
                  </code>
                </span>
              )}
            </li>
            <li className="flex gap-2">
              <span style={{ color: 'rgba(168,85,247,0.7)' }}>4.</span>
              <span>Save and redeploy — access takes effect immediately after deploy.</span>
            </li>
          </ol>
        </div>

        <Button type="button" className="w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

type InviteState = 'idle' | 'sending' | 'sent' | 'error';

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<InviteState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setErrorMsg(body.message ?? 'Failed to send invitation.');
        setState('error');
        return;
      }

      setState('sent');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {state === 'sent' ? (
          <div className="text-center">
            <div className="mb-3 text-3xl">✉️</div>
            <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Invitation sent
            </h3>
            <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              WorkOS sent a sign-up link to{' '}
              <strong style={{ color: 'var(--foreground)' }}>{email}</strong>.
            </p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              Invite user
            </h3>
            <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              WorkOS will email them a sign-up link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  Email address
                </label>
                <input
                  ref={inputRef}
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@example.com"
                  className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {state === 'error' && (
                <p className="text-xs" style={{ color: 'rgba(255,80,80,0.9)' }}>
                  {errorMsg}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={onClose}
                  disabled={state === 'sending'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={state === 'sending' || !email.trim()}
                >
                  {state === 'sending' ? 'Sending…' : 'Send invite'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ActiveModal =
  | { type: 'invite' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'delete'; user: AdminUser }
  | { type: 'access'; user: AdminUser; grant: boolean }
  | null;

const COLS = ['ID', 'Handle', 'Name', 'Email', 'Joined', 'Behind Admin', 'Status', 'Actions'];

export function UsersTable({ adminEmails }: { adminEmails: string[] }) {
  const [state, setState] = useState<FetchState>({ status: 'loading' });
  const [modal, setModal] = useState<ActiveModal>(null);
  const [search, setSearch] = useState('');

  const adminEmailSet = new Set(adminEmails.map((e) => e.toLowerCase()));

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/users')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ users: AdminUser[] }>;
      })
      .then(({ users }) => {
        if (!cancelled) setState({ status: 'ok', users });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load users.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateUser(updated: AdminUser) {
    setState((prev) => {
      if (prev.status !== 'ok') return prev;
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      };
    });
  }

  function removeUser(id: string) {
    setState((prev) => {
      if (prev.status !== 'ok') return prev;
      return { ...prev, users: prev.users.filter((u) => u.id !== id) };
    });
  }

  function handleStatusChange(id: string, isSuspended: boolean) {
    setState((prev) => {
      if (prev.status !== 'ok') return prev;
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, isSuspended } : u)),
      };
    });
  }

  const allUsers = state.status === 'ok' ? state.users : [];
  const filteredUsers = allUsers.filter((u) => matchesSearch(u, search.trim()));

  return (
    <>
      {modal?.type === 'invite' && <InviteModal onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && (
        <EditModal user={modal.user} onClose={() => setModal(null)} onSaved={updateUser} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal user={modal.user} onClose={() => setModal(null)} onDeleted={removeUser} />
      )}
      {modal?.type === 'access' && (
        <AdminAccessModal user={modal.user} grant={modal.grant} onClose={() => setModal(null)} />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Registered users</CardTitle>
              <CardDescription>
                {state.status === 'loading' && 'Loading…'}
                {state.status === 'error' && 'Could not load user data.'}
                {state.status === 'ok' &&
                  (search.trim()
                    ? `${filteredUsers.length} of ${allUsers.length} users`
                    : `${allUsers.length} ${allUsers.length === 1 ? 'user' : 'users'} registered`)}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setModal({ type: 'invite' })}>
              Invite user
            </Button>
          </div>

          {/* Search bar */}
          <div className="mt-3 relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, handle or email…"
              className="w-full rounded-md py-2 pl-9 pr-3 text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--foreground)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                ✕
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {COLS.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.status === 'loading' && <LoadingRows cols={COLS.length} />}
                {state.status === 'error' && (
                  <ErrorRow message={state.message} cols={COLS.length} />
                )}
                {state.status === 'ok' && filteredUsers.length === 0 && (
                  <EmptyRow cols={COLS.length} query={search.trim()} />
                )}
                {state.status === 'ok' &&
                  filteredUsers.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isAdmin={adminEmailSet.has(u.email.toLowerCase())}
                      onStatusChange={handleStatusChange}
                      onEdit={(user) => setModal({ type: 'edit', user })}
                      onDelete={(user) => setModal({ type: 'delete', user })}
                      onManageAccess={(user, grant) => setModal({ type: 'access', user, grant })}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
