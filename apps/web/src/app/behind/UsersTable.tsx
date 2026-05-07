'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BehindRole, RolesMap } from '@/lib/behind-redis';

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

// ─── Shared ───────────────────────────────────────────────────────────────────

function Dash() {
  return <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>;
}

function RoleBadge({ role, locked }: { role: BehindRole; locked?: boolean }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1">
        <Badge
          variant="outline"
          className="border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs"
        >
          owner
        </Badge>
        {locked && (
          <span
            title="Set via BEHIND_ADMIN_EMAILS env var"
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}
          >
            🔒
          </span>
        )}
      </span>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 text-xs"
    >
      admin
    </Badge>
  );
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

const COLS = ['Handle', 'Name', 'Email', 'Joined', 'Role', 'Status', 'Actions'];

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: COLS.length }).map((_, j) => (
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

function ErrorRow({ message }: { message: string }) {
  return (
    <tr>
      <td
        colSpan={COLS.length}
        className="px-4 py-10 text-center text-sm"
        style={{ color: 'rgba(255,80,80,0.8)' }}
      >
        {message}
      </td>
    </tr>
  );
}

function EmptyRow({ query }: { query: string }) {
  return (
    <tr>
      <td
        colSpan={COLS.length}
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
  role,
  locked,
  isCurrentUser,
  currentUserRole,
  onStatusChange,
  onEdit,
  onDelete,
  onRoleChange,
}: {
  user: AdminUser;
  role: BehindRole | null;
  locked: boolean;
  isCurrentUser: boolean;
  currentUserRole: BehindRole | null;
  onStatusChange: (id: string, isSuspended: boolean) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, newRole: BehindRole | 'none') => void;
}) {
  const handle = user.artistUsernames[0] ?? null;
  const [suspending, setSuspending] = useState(false);

  const canManageRoles = currentUserRole === 'owner' && !isCurrentUser && !locked;

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
      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {handle ? (
          <span style={{ color: 'var(--foreground)' }}>@{handle}</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Dash />
            <span title="No handle set" style={{ color: 'rgba(234,179,8,0.8)', fontSize: '8px' }}>
              ●
            </span>
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)' }}>
        {user.name ? (
          <>
            {user.name}
            {isCurrentUser && (
              <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                (you)
              </span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Dash />
            <span title="No name set" style={{ color: 'rgba(234,179,8,0.8)', fontSize: '8px' }}>
              ●
            </span>
            {isCurrentUser && (
              <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                (you)
              </span>
            )}
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {user.email}
      </td>

      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {formatDate(user.createdAt)}
      </td>

      <td className="px-4 py-3">{role ? <RoleBadge role={role} locked={locked} /> : <Dash />}</td>

      <td className="px-4 py-3">
        {user.isSuspended ? (
          <Badge variant="destructive">suspended</Badge>
        ) : (
          <Badge variant="secondary">active</Badge>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1 flex-wrap">
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

          {canManageRoles && (
            <>
              {role === null && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-fuchsia-400 hover:text-fuchsia-300"
                  onClick={() => onRoleChange(user, 'admin')}
                >
                  → Admin
                </Button>
              )}
              {role === 'admin' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300"
                    onClick={() => onRoleChange(user, 'owner')}
                  >
                    → Owner
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => onRoleChange(user, 'none')}
                  >
                    Revoke
                  </Button>
                </>
              )}
              {role === 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-fuchsia-400 hover:text-fuchsia-300"
                  onClick={() => onRoleChange(user, 'admin')}
                >
                  → Admin
                </Button>
              )}
            </>
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

  useEffect(() => {
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
            hint="Managed by WorkOS."
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

// ─── Delete modal ─────────────────────────────────────────────────────────────

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
        className="w-full max-w-sm rounded-xl p-6 text-center"
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
        <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          Delete user?
        </h3>
        <p className="mb-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <strong style={{ color: 'var(--foreground)' }}>{user.name ?? user.email}</strong>
        </p>
        <p className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Soft delete — data preserved, access revoked immediately.
        </p>
        {error && (
          <p className="mb-3 text-xs" style={{ color: 'rgba(255,80,80,0.9)' }}>
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

// ─── Role change confirm modal ────────────────────────────────────────────────

function RoleChangeModal({
  user,
  newRole,
  onClose,
  onConfirmed,
}: {
  user: AdminUser;
  newRole: BehindRole | 'none';
  onClose: () => void;
  onConfirmed: (roles: RolesMap, lockedEmails: string[]) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const label =
    newRole === 'none'
      ? 'Revoke access'
      : newRole === 'owner'
        ? 'Promote to owner'
        : 'Grant admin access';

  const description =
    newRole === 'none'
      ? `${user.name ?? user.email} will lose access to Behind the Stage immediately.`
      : newRole === 'owner'
        ? `${user.name ?? user.email} will become an owner — they can manage roles and access everything.`
        : `${user.name ?? user.email} will get access to Behind the Stage as an admin.`;

  async function handleConfirm() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/behind-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, role: newRole }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not update role.');
        return;
      }
      const { roles, lockedEmails } = (await res.json()) as {
        roles: RolesMap;
        lockedEmails: string[];
      };
      onConfirmed(roles, lockedEmails);
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
        <h3 className="mb-2 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          {label}
        </h3>
        <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {description}
        </p>
        {error && (
          <p className="mb-3 text-xs" style={{ color: 'rgba(255,80,80,0.9)' }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className={`flex-1 ${newRole === 'none' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </div>
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
  | { type: 'role'; user: AdminUser; newRole: BehindRole | 'none' }
  | null;

export function UsersTable({
  roles: initialRoles,
  lockedOwnerEmails: initialLockedEmails,
  currentUserEmail,
}: {
  roles: RolesMap;
  lockedOwnerEmails: string[];
  currentUserEmail: string;
}) {
  const [state, setState] = useState<FetchState>({ status: 'loading' });
  const [modal, setModal] = useState<ActiveModal>(null);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<RolesMap>(initialRoles);
  const [lockedEmails, setLockedEmails] = useState<Set<string>>(
    new Set(initialLockedEmails.map((e) => e.toLowerCase())),
  );

  const currentUserRole = roles[currentUserEmail.toLowerCase()] ?? null;

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
        if (!cancelled)
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load users.',
          });
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
      return { ...prev, users: prev.users.map((u) => (u.id === id ? { ...u, isSuspended } : u)) };
    });
  }

  const handleRolesUpdated = useCallback((newRoles: RolesMap, newLocked: string[]) => {
    setRoles(newRoles);
    setLockedEmails(new Set(newLocked.map((e) => e.toLowerCase())));
  }, []);

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
      {modal?.type === 'role' && (
        <RoleChangeModal
          user={modal.user}
          newRole={modal.newRole}
          onClose={() => setModal(null)}
          onConfirmed={handleRolesUpdated}
        />
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
              className="w-full rounded-md py-2 pl-9 pr-8 text-sm outline-none focus:ring-2"
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
                {state.status === 'loading' && <LoadingRows />}
                {state.status === 'error' && <ErrorRow message={state.message} />}
                {state.status === 'ok' && filteredUsers.length === 0 && (
                  <EmptyRow query={search.trim()} />
                )}
                {state.status === 'ok' &&
                  filteredUsers.map((u) => {
                    const emailKey = u.email.toLowerCase();
                    return (
                      <UserRow
                        key={u.id}
                        user={u}
                        role={roles[emailKey] ?? null}
                        locked={lockedEmails.has(emailKey)}
                        isCurrentUser={emailKey === currentUserEmail.toLowerCase()}
                        currentUserRole={currentUserRole as BehindRole | null}
                        onStatusChange={handleStatusChange}
                        onEdit={(user) => setModal({ type: 'edit', user })}
                        onDelete={(user) => setModal({ type: 'delete', user })}
                        onRoleChange={(user, newRole) => setModal({ type: 'role', user, newRole })}
                      />
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
