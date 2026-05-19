'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BehindRole, RolesMap } from '@/lib/behind-redis';
import { trackUmamiEvent } from '@/lib/analytics/umami';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtistSubscription {
  plan: string; // commercial plan
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  manualAccessPlan: string | null;
  manualAccessStartsAt: string | null;
  manualAccessExpiresAt: string | null; // ISO string
  manualAccessReason: string | null;
  manualAccessGrantedBy: string | null;
  isManualGrantActive: boolean;
  effectiveAccess: string;
  accessSource: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  artistUsernames: string[];
  isSuspended: boolean;
  createdAt: string;
  /** First artist's subscription/access summary. null if no artist/subscription. */
  subscription: ArtistSubscription | null;
}

// Shared dark modal panel surface — fixes the near-invisible var(--card) bug.
const MODAL_PANEL_STYLE = {
  backgroundColor: '#1a1030',
  border: '1px solid rgba(255,255,255,0.12)',
} as const;

// ─── Sorting / Filtering types ────────────────────────────────────────────────

type SortField = 'handle' | 'name' | 'email' | 'joined' | 'plan' | 'role' | 'status';
type SortDir = 'asc' | 'desc';
type FilterPlan = 'all' | 'free' | 'pro' | 'pro_plus';
type FilterRole = 'all' | 'owner' | 'admin' | 'user';
type FilterStatus = 'all' | 'active' | 'suspended';

interface ColDef {
  key: SortField | 'actions';
  label: string;
  sortable: boolean;
}

const COLS: ColDef[] = [
  { key: 'handle', label: 'Handle', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
  { key: 'plan', label: 'Plan', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, pro_plus: 2 };
const ROLE_RANK: Record<string, number> = { owner: 2, admin: 1 };
const INVITATION_UMAMI_CONTEXT = {
  surface: 'users_table',
  channel: 'workos_email',
  source: 'behind_users',
  medium: 'email_invite',
} as const;

// ─── Plan helpers ─────────────────────────────────────────────────────────────

function planLabel(plan: string): string {
  if (plan === 'pro_plus') return 'PRO+';
  if (plan === 'pro') return 'PRO';
  return 'Free';
}

function PlanBadge({ plan }: { plan: string }) {
  const isPlus = plan === 'pro_plus';
  const isPro = plan === 'pro';
  // Free → amber so it has visual weight without suggesting a paid state
  const cls = isPlus
    ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300'
    : isPro
      ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
      : 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return (
    <Badge variant="outline" className={`${cls} text-xs`}>
      {planLabel(plan)}
    </Badge>
  );
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

function applyFilters(
  users: AdminUser[],
  search: string,
  filterPlan: FilterPlan,
  filterRole: FilterRole,
  filterStatus: FilterStatus,
  roles: RolesMap,
): AdminUser[] {
  return users.filter((u) => {
    if (!matchesSearch(u, search)) return false;
    if (filterPlan !== 'all' && (u.subscription?.plan ?? 'free') !== filterPlan) return false;
    if (filterRole !== 'all') {
      const role = roles[u.email.toLowerCase()] ?? null;
      if (filterRole === 'owner' && role !== 'owner') return false;
      if (filterRole === 'admin' && role !== 'admin') return false;
      if (filterRole === 'user' && role !== null) return false;
    }
    if (filterStatus === 'active' && u.isSuspended) return false;
    if (filterStatus === 'suspended' && !u.isSuspended) return false;
    return true;
  });
}

function applySort(
  users: AdminUser[],
  field: SortField,
  dir: SortDir,
  roles: RolesMap,
): AdminUser[] {
  return [...users].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'handle':
        cmp = (a.artistUsernames[0] ?? '').localeCompare(b.artistUsernames[0] ?? '');
        break;
      case 'name':
        cmp = (a.name ?? a.email).localeCompare(b.name ?? b.email);
        break;
      case 'email':
        cmp = a.email.localeCompare(b.email);
        break;
      case 'joined':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'plan':
        cmp =
          (PLAN_RANK[a.subscription?.plan ?? 'free'] ?? 0) -
          (PLAN_RANK[b.subscription?.plan ?? 'free'] ?? 0);
        break;
      case 'role': {
        const ra = ROLE_RANK[roles[a.email.toLowerCase()] ?? ''] ?? 0;
        const rb = ROLE_RANK[roles[b.email.toLowerCase()] ?? ''] ?? 0;
        cmp = ra - rb;
        break;
      }
      case 'status':
        cmp = Number(a.isSuspended) - Number(b.isSuspended);
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
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

// ─── Access cell ──────────────────────────────────────────────────────────────

function AccessCell({ sub }: { sub: ArtistSubscription | null }) {
  if (!sub) {
    return <Dash />;
  }

  const grantActive = sub.isManualGrantActive && sub.manualAccessPlan;
  const elevated = sub.accessSource === 'manual_admin_grant' && grantActive;
  const expires = sub.manualAccessExpiresAt ? formatDate(sub.manualAccessExpiresAt) : 'no expiry';

  return (
    <div className="flex flex-col gap-1">
      <PlanBadge plan={sub.plan} />
      {grantActive && (
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: 'rgba(232,121,249,0.95)' }}
          title={
            (sub.manualAccessReason ? `Reason: ${sub.manualAccessReason}\n` : '') +
            `Granted access: ${planLabel(sub.manualAccessPlan!)} until ${expires}`
          }
        >
          ⚡ {planLabel(sub.manualAccessPlan!)} until {expires}
        </span>
      )}
      {elevated && sub.effectiveAccess !== sub.plan && (
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          effective: {planLabel(sub.effectiveAccess)}
        </span>
      )}
    </div>
  );
}

// ─── Row actions dropdown ─────────────────────────────────────────────────────

function DropItem({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-2 text-left text-sm transition-colors"
      style={{ color: color ?? 'rgba(255,255,255,0.8)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      {label}
    </button>
  );
}

function RowActionsDropdown({
  user,
  role,
  locked,
  isCurrentUser,
  currentUserRole,
  onEdit,
  onStatusChange,
  onRoleChange,
  onManageAccess,
}: {
  user: AdminUser;
  role: BehindRole | null;
  locked: boolean;
  isCurrentUser: boolean;
  currentUserRole: BehindRole | null;
  onEdit: (user: AdminUser) => void;
  onStatusChange: (id: string, isSuspended: boolean) => void;
  onRoleChange: (user: AdminUser, newRole: BehindRole | 'none') => void;
  onManageAccess: (user: AdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const canManageRoles = currentUserRole === 'owner' && !isCurrentUser && !locked;
  const canManageUsers = currentUserRole === 'owner';

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function toggleSuspend() {
    setSuspending(true);
    setOpen(false);
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
      trackUmamiEvent('behind_user_status_updated', {
        status: updated.isSuspended ? 'suspended' : 'active',
      });
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSuspending(false);
    }
  }

  if (!canManageUsers && !canManageRoles) {
    return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Read-only</span>;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={suspending}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        title="Actions"
        style={{
          color: suspending ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
          backgroundColor: open ? 'rgba(255,255,255,0.08)' : 'transparent',
        }}
      >
        {suspending ? (
          <span className="text-xs">…</span>
        ) : (
          /* vertical three-dot icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[168px] rounded-lg py-1 shadow-xl"
          style={{
            backgroundColor: '#1a1030',
            border: '1px solid rgba(255,255,255,0.12)',
            top: '100%',
          }}
        >
          {canManageUsers && (
            <>
              <DropItem
                label="Edit"
                onClick={() => {
                  setOpen(false);
                  onEdit(user);
                }}
              />
              <DropItem
                label={user.isSuspended ? 'Unsuspend' : 'Suspend'}
                color={user.isSuspended ? 'rgba(74,222,128,0.9)' : 'rgba(251,191,36,0.9)'}
                onClick={toggleSuspend}
              />
            </>
          )}

          {canManageRoles && (
            <>
              {role === null && (
                <DropItem
                  label="Make Admin"
                  color="rgba(232,121,249,0.9)"
                  onClick={() => {
                    setOpen(false);
                    onRoleChange(user, 'admin');
                  }}
                />
              )}
              {role === 'admin' && (
                <>
                  <DropItem
                    label="Make Owner"
                    color="rgba(167,139,250,0.9)"
                    onClick={() => {
                      setOpen(false);
                      onRoleChange(user, 'owner');
                    }}
                  />
                  <DropItem
                    label="Revoke Role"
                    color="rgba(248,113,113,0.9)"
                    onClick={() => {
                      setOpen(false);
                      onRoleChange(user, 'none');
                    }}
                  />
                </>
              )}
              {role === 'owner' && (
                <DropItem
                  label="Demote to Admin"
                  color="rgba(232,121,249,0.9)"
                  onClick={() => {
                    setOpen(false);
                    onRoleChange(user, 'admin');
                  }}
                />
              )}
            </>
          )}

          {canManageUsers && user.artistUsernames.length > 0 && (
            <>
              <div style={{ margin: '4px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
              <DropItem
                label="Grant Temp Access"
                color="rgba(167,139,250,0.9)"
                onClick={() => {
                  setOpen(false);
                  onManageAccess(user);
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
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
  onRoleChange,
  onManageAccess,
}: {
  user: AdminUser;
  role: BehindRole | null;
  locked: boolean;
  isCurrentUser: boolean;
  currentUserRole: BehindRole | null;
  onStatusChange: (id: string, isSuspended: boolean) => void;
  onEdit: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, newRole: BehindRole | 'none') => void;
  onManageAccess: (user: AdminUser) => void;
}) {
  const handle = user.artistUsernames[0] ?? null;

  return (
    <tr
      className="transition-colors"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      {/* Handle */}
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

      {/* Name */}
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

      {/* Email */}
      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {user.email}
      </td>

      {/* Joined */}
      <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {formatDate(user.createdAt)}
      </td>

      {/* Plan */}
      <td className="px-4 py-3">
        <AccessCell sub={user.subscription} />
      </td>

      {/* Role — null shows "User" instead of an empty dash */}
      <td className="px-4 py-3">
        {role ? (
          <RoleBadge role={role} locked={locked} />
        ) : (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            User
          </span>
        )}
      </td>

      {/* Status — active is green, suspended is red */}
      <td className="px-4 py-3">
        {user.isSuspended ? (
          <Badge variant="destructive">suspended</Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs"
          >
            active
          </Badge>
        )}
      </td>

      {/* Actions — dropdown */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <RowActionsDropdown
          user={user}
          role={role}
          locked={locked}
          isCurrentUser={isCurrentUser}
          currentUserRole={currentUserRole}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onRoleChange={onRoleChange}
          onManageAccess={onManageAccess}
        />
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
      trackUmamiEvent('behind_user_profile_updated');
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
      <div className="w-full max-w-sm rounded-xl p-6" style={MODAL_PANEL_STYLE}>
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
      trackUmamiEvent('behind_role_updated', {
        role: newRole,
      });
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
      <div className="w-full max-w-sm rounded-xl p-6" style={MODAL_PANEL_STYLE}>
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
    trackUmamiEvent('behind_invitation_submitted', INVITATION_UMAMI_CONTEXT);
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
        trackUmamiEvent('behind_invitation_failed', {
          ...INVITATION_UMAMI_CONTEXT,
          result: 'api_error',
          status: res.status,
        });
        return;
      }
      setState('sent');
      trackUmamiEvent('behind_invitation_sent', {
        ...INVITATION_UMAMI_CONTEXT,
        result: 'sent',
      });
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
      trackUmamiEvent('behind_invitation_failed', {
        ...INVITATION_UMAMI_CONTEXT,
        result: 'network_error',
      });
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
      <div className="w-full max-w-sm rounded-xl p-6" style={MODAL_PANEL_STYLE}>
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

// ─── Manage access modal ──────────────────────────────────────────────────────

/** YYYY-MM-DD value (for <input type="date">) `days` from now. */
function dateInputValue(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ color: 'var(--foreground)' }}>{value}</span>
    </div>
  );
}

function ManageAccessModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (userId: string, sub: ArtistSubscription) => void;
}) {
  const sub = user.subscription;
  const hasGrant = Boolean(sub?.manualAccessPlan);

  // mode: 'view' | 'grant' | 'extend'
  const [mode, setMode] = useState<'view' | 'grant' | 'extend'>('view');
  const [plan, setPlan] = useState<'pro' | 'pro_plus'>(
    (sub?.manualAccessPlan as 'pro' | 'pro_plus') ?? 'pro',
  );
  const [expiresAt, setExpiresAt] = useState<string>(
    sub?.manualAccessExpiresAt ? sub.manualAccessExpiresAt.slice(0, 10) : dateInputValue(30),
  );
  const [reason, setReason] = useState(sub?.manualAccessReason ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function submitGrant(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          expiresAt: new Date(`${expiresAt}T23:59:59`).toISOString(),
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(
          Array.isArray(body.message)
            ? body.message.join(', ')
            : (body.message ?? 'Could not grant access.'),
        );
        return;
      }
      const { subscription } = (await res.json()) as { subscription: ArtistSubscription };
      onUpdated(user.id, subscription);
      trackUmamiEvent('behind_access_granted', {
        plan,
      });
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitExtend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}/access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresAt: new Date(`${expiresAt}T23:59:59`).toISOString(),
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(
          Array.isArray(body.message)
            ? body.message.join(', ')
            : (body.message ?? 'Could not extend access.'),
        );
        return;
      }
      const { subscription } = (await res.json()) as { subscription: ArtistSubscription };
      onUpdated(user.id, subscription);
      trackUmamiEvent('behind_access_extended', {
        plan: sub?.manualAccessPlan ?? 'unknown',
      });
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function doRevoke() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${user.id}/access`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Could not revoke access.');
        return;
      }
      const { subscription } = (await res.json()) as { subscription: ArtistSubscription };
      onUpdated(user.id, subscription);
      trackUmamiEvent('behind_access_revoked');
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
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
      <div className="w-full max-w-md rounded-xl p-6" style={MODAL_PANEL_STYLE}>
        <h3 className="mb-1 text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          Manage access
        </h3>
        <p className="mb-4 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {user.name ?? user.email}
        </p>

        {error && (
          <p className="mb-3 text-xs" style={{ color: 'rgba(255,80,80,0.9)' }}>
            {error}
          </p>
        )}

        {mode === 'view' && (
          <>
            <div
              className="mb-4 space-y-2 rounded-lg p-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <InfoLine label="Commercial plan" value={<PlanBadge plan={sub?.plan ?? 'free'} />} />
              <InfoLine label="Subscription status" value={sub?.status ?? 'inactive'} />
              <InfoLine
                label="Effective access"
                value={<PlanBadge plan={sub?.effectiveAccess ?? 'free'} />}
              />
              <InfoLine
                label="Access source"
                value={
                  sub?.accessSource === 'manual_admin_grant' ? 'Admin grant ⚡' : 'Commercial plan'
                }
              />
              {hasGrant && (
                <>
                  <div className="my-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                  <InfoLine
                    label="Granted plan"
                    value={<PlanBadge plan={sub!.manualAccessPlan!} />}
                  />
                  <InfoLine
                    label="Expires"
                    value={
                      sub!.manualAccessExpiresAt
                        ? formatDate(sub!.manualAccessExpiresAt)
                        : 'no expiry'
                    }
                  />
                  <InfoLine
                    label="Active now"
                    value={sub!.isManualGrantActive ? 'Yes' : 'No (expired)'}
                  />
                  {sub!.manualAccessReason && (
                    <InfoLine label="Reason" value={sub!.manualAccessReason} />
                  )}
                </>
              )}
            </div>

            {confirmRevoke ? (
              <div className="space-y-2">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Revoke this grant? The tenant falls back to their commercial plan immediately.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setConfirmRevoke(false)}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={doRevoke}
                    disabled={busy}
                  >
                    {busy ? 'Revoking…' : 'Revoke'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {!hasGrant && (
                  <Button type="button" className="flex-1" onClick={() => setMode('grant')}>
                    Grant temporary access
                  </Button>
                )}
                {hasGrant && (
                  <>
                    <Button type="button" className="flex-1" onClick={() => setMode('extend')}>
                      Extend
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 text-red-400 hover:text-red-300"
                      onClick={() => setConfirmRevoke(true)}
                    >
                      Revoke
                    </Button>
                  </>
                )}
                <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </>
        )}

        {mode === 'grant' && (
          <form onSubmit={submitGrant} className="space-y-4">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Plan
              </label>
              <div className="flex gap-2">
                {(['pro', 'pro_plus'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className="flex-1 rounded-md px-3 py-2 text-sm"
                    style={{
                      backgroundColor:
                        plan === p ? 'rgba(232,121,249,0.18)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${plan === p ? 'rgba(232,121,249,0.5)' : 'rgba(255,255,255,0.12)'}`,
                      color: plan === p ? 'rgb(240,171,252)' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {planLabel(p)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                htmlFor="grant-expiry"
                className="mb-1.5 block text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Expires on
              </label>
              <input
                id="grant-expiry"
                type="date"
                required
                min={dateInputValue(1)}
                max={dateInputValue(365)}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--foreground)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <ModalField
              id="grant-reason"
              label="Reason (optional)"
              value={reason}
              onChange={setReason}
              placeholder="e.g. partnership trial"
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setMode('view')}
                disabled={busy}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy ? 'Granting…' : 'Grant access'}
              </Button>
            </div>
          </form>
        )}

        {mode === 'extend' && (
          <form onSubmit={submitExtend} className="space-y-4">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Extending {planLabel(sub?.manualAccessPlan ?? 'pro')} grant.
            </p>
            <div>
              <label
                htmlFor="extend-expiry"
                className="mb-1.5 block text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                New expiry
              </label>
              <input
                id="extend-expiry"
                type="date"
                required
                min={dateInputValue(1)}
                max={dateInputValue(365)}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--foreground)',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <ModalField
              id="extend-reason"
              label="Reason (optional)"
              value={reason}
              onChange={setReason}
              placeholder="Update reason"
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setMode('view')}
                disabled={busy}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy ? 'Saving…' : 'Update expiry'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Filter pill row ──────────────────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-2.5 py-0.5 text-xs transition-colors"
      style={{
        backgroundColor: active ? 'rgba(155,48,208,0.2)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? 'rgba(155,48,208,0.5)' : 'rgba(255,255,255,0.1)'}`,
        color: active ? 'rgb(216,180,254)' : 'rgba(255,255,255,0.45)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ActiveModal =
  | { type: 'invite' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'role'; user: AdminUser; newRole: BehindRole | 'none' }
  | { type: 'access'; user: AdminUser }
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

  // ── Filter state
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('all');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // ── Sort state (default: most recently joined first)
  const [sortField, setSortField] = useState<SortField>('joined');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  function handleAccessUpdated(userId: string, sub: ArtistSubscription) {
    setState((prev) => {
      if (prev.status !== 'ok') return prev;
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, subscription: sub } : u)),
      };
    });
  }

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    trackUmamiEvent('behind_users_sorted', {
      field,
      direction: sortField === field && sortDir === 'asc' ? 'desc' : 'asc',
    });
  }

  function handlePlanFilterChange(value: FilterPlan) {
    setFilterPlan(value);
    trackUmamiEvent('behind_users_filtered', {
      filter: 'plan',
      value,
    });
  }

  function handleRoleFilterChange(value: FilterRole) {
    setFilterRole(value);
    trackUmamiEvent('behind_users_filtered', {
      filter: 'role',
      value,
    });
  }

  function handleStatusFilterChange(value: FilterStatus) {
    setFilterStatus(value);
    trackUmamiEvent('behind_users_filtered', {
      filter: 'status',
      value,
    });
  }

  function handleInviteOpen() {
    trackUmamiEvent('behind_invite_opened', INVITATION_UMAMI_CONTEXT);
    setModal({ type: 'invite' });
  }

  const allUsers = state.status === 'ok' ? state.users : [];
  const filteredUsers = applySort(
    applyFilters(allUsers, search.trim(), filterPlan, filterRole, filterStatus, roles),
    sortField,
    sortDir,
    roles,
  );

  const hasActiveFilters =
    filterPlan !== 'all' || filterRole !== 'all' || filterStatus !== 'all' || search.trim() !== '';

  return (
    <>
      {modal?.type === 'invite' && <InviteModal onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && (
        <EditModal user={modal.user} onClose={() => setModal(null)} onSaved={updateUser} />
      )}
      {modal?.type === 'role' && (
        <RoleChangeModal
          user={modal.user}
          newRole={modal.newRole}
          onClose={() => setModal(null)}
          onConfirmed={handleRolesUpdated}
        />
      )}
      {modal?.type === 'access' && (
        <ManageAccessModal
          user={modal.user}
          onClose={() => setModal(null)}
          onUpdated={handleAccessUpdated}
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
                  (hasActiveFilters
                    ? `${filteredUsers.length} of ${allUsers.length} users`
                    : `${allUsers.length} ${allUsers.length === 1 ? 'user' : 'users'} registered`)}
              </CardDescription>
            </div>
            {currentUserRole === 'owner' && (
              <Button size="sm" onClick={handleInviteOpen}>
                Invite user
              </Button>
            )}
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

          {/* Filter pills */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {/* Plan filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Plan
              </span>
              {(['all', 'free', 'pro', 'pro_plus'] as FilterPlan[]).map((p) => (
                <FilterPill
                  key={p}
                  active={filterPlan === p}
                  onClick={() => handlePlanFilterChange(p)}
                >
                  {p === 'all' ? 'All' : planLabel(p)}
                </FilterPill>
              ))}
            </div>

            {/* Role filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Role
              </span>
              {(['all', 'owner', 'admin', 'user'] as FilterRole[]).map((r) => (
                <FilterPill
                  key={r}
                  active={filterRole === r}
                  onClick={() => handleRoleFilterChange(r)}
                >
                  {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                </FilterPill>
              ))}
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Status
              </span>
              {(['all', 'active', 'suspended'] as FilterStatus[]).map((s) => (
                <FilterPill
                  key={s}
                  active={filterStatus === s}
                  onClick={() => handleStatusFilterChange(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </FilterPill>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                      style={{
                        color:
                          sortField === col.key
                            ? 'rgba(216,180,254,0.9)'
                            : 'rgba(255,255,255,0.35)',
                      }}
                      onClick={
                        col.sortable ? () => handleSortClick(col.key as SortField) : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.sortable && (
                          <span
                            style={{
                              opacity: sortField === col.key ? 1 : 0.3,
                              fontSize: '10px',
                            }}
                          >
                            {sortField === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        )}
                      </span>
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
                        onRoleChange={(user, newRole) => setModal({ type: 'role', user, newRole })}
                        onManageAccess={(user) => setModal({ type: 'access', user })}
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
