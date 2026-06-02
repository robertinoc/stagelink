'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { BehindRole, RolesMap } from '@/lib/behind-redis';

// ─── Design tokens ──────────────────────────────────────────────────────────────
const GRADIENT = 'linear-gradient(135deg, #E040FB 0%, #9B30D0 45%, #4A1A8C 100%)';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TemporaryAccess {
  plan: 'pro' | 'pro+';
  until: string;
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
  plan?: 'free' | 'pro' | 'pro+';
  temporaryAccess?: TemporaryAccess | null;
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; users: AdminUser[] };

type PlanFilter = 'all' | 'free' | 'pro' | 'pro+';
type RoleFilter = 'all' | 'owner' | 'admin' | 'user';
type StatusFilter = 'all' | 'active' | 'suspended';

type ActiveModal =
  | { type: 'invite' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'delete'; user: AdminUser }
  | { type: 'role'; user: AdminUser; newRole: BehindRole | 'none' }
  | null;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function effectivePlan(user: AdminUser): string {
  return user.temporaryAccess?.plan ?? user.plan ?? 'free';
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

function isWithin30Days(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 30 * 24 * 60 * 60 * 1000;
}

function avatarGradient(seed: string): string {
  const h = (seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;
  return `linear-gradient(135deg, hsl(${h},65%,35%), hsl(${(h + 60) % 360},75%,55%))`;
}

// ─── Inline icons ────────────────────────────────────────────────────────────────

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── Plan badge ──────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  if (plan === 'pro+') {
    return (
      <span
        style={{
          padding: '3px 9px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          background: GRADIENT,
          color: '#fff',
          boxShadow: '0 0 10px rgba(224,64,251,0.25)',
          fontFamily: '"Space Grotesk", sans-serif',
          display: 'inline-block',
        }}
      >
        PRO+
      </span>
    );
  }
  if (plan === 'pro') {
    return (
      <span
        style={{
          padding: '3px 9px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: 'rgba(0,212,255,0.12)',
          color: '#00D4FF',
          border: '1px solid rgba(0,212,255,0.3)',
          fontFamily: '"Space Grotesk", sans-serif',
          display: 'inline-block',
        }}
      >
        PRO
      </span>
    );
  }
  return (
    <span
      style={{
        padding: '3px 9px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: 'rgba(251,191,36,0.12)',
        color: '#FBBF24',
        border: '1px solid rgba(251,191,36,0.28)',
        fontFamily: '"Space Grotesk", sans-serif',
        display: 'inline-block',
      }}
    >
      Free
    </span>
  );
}

// ─── Role badge ──────────────────────────────────────────────────────────────────

function RoleBadge({ role, locked }: { role: BehindRole; locked?: boolean }) {
  if (role === 'owner') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 9px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          background: GRADIENT,
          color: '#fff',
          boxShadow: '0 0 10px rgba(224,64,251,0.2)',
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        👑 owner
        {locked && (
          <span title="Set via BEHIND_ADMIN_EMAILS env var" style={{ opacity: 0.6 }}>
            🔒
          </span>
        )}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: 'rgba(0,212,255,0.12)',
        color: '#00D4FF',
        border: '1px solid rgba(0,212,255,0.28)',
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      🛡 admin
    </span>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────────

function StatusBadge({ suspended }: { suspended: boolean }) {
  const color = suspended ? '#ff6b6b' : '#4ADE80';
  const bg = suspended ? 'rgba(255,107,107,0.12)' : 'rgba(74,222,128,0.12)';
  const border = suspended ? 'rgba(255,107,107,0.25)' : 'rgba(74,222,128,0.25)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}88`,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {suspended ? 'suspended' : 'active'}
    </span>
  );
}

// ─── KPI tile ────────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  accent,
  caption,
  icon,
}: {
  label: string;
  value: number | string;
  accent: string;
  caption: string;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: '20px 22px',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.38)',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: `${accent}18`,
            border: `1px solid ${accent}28`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
          }}
        >
          {icon}
        </span>
      </div>
      <div
        style={{
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontFamily: '"Space Grotesk", sans-serif',
          color: accent,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          width: 28,
          height: 2,
          borderRadius: 1,
          backgroundColor: accent,
          opacity: 0.45,
          marginBottom: 8,
        }}
      />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{caption}</div>
    </div>
  );
}

// ─── Filter group ────────────────────────────────────────────────────────────────

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                border: active
                  ? '1px solid rgba(224,64,251,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                background: active ? GRADIENT : 'rgba(255,255,255,0.04)',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: active ? '0 0 14px rgba(224,64,251,0.3)' : 'none',
                transition: 'all 0.15s',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Action menu item ────────────────────────────────────────────────────────────

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  accent,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  accent?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 14px',
        border: 'none',
        backgroundColor: 'transparent',
        color: danger ? '#ff6b6b' : (accent ?? 'rgba(255,255,255,0.8)'),
        fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.4 : 1,
        transition: 'background-color 0.1s',
        fontFamily: '"Inter", sans-serif',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 12, flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── User row ────────────────────────────────────────────────────────────────────

const ROW_GRID = '1.4fr 1.3fr 1.9fr 0.9fr 1.3fr 0.9fr 1fr 48px';

function UserRow({
  user,
  role,
  locked,
  isCurrentUser,
  currentUserRole,
  menuOpenId,
  onMenuToggle,
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
  menuOpenId: string | null;
  onMenuToggle: (id: string | null) => void;
  onStatusChange: (id: string, isSuspended: boolean) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, newRole: BehindRole | 'none') => void;
}) {
  const handle = user.artistUsernames[0] ?? null;
  const initials = (handle?.[0] ?? user.email[0] ?? '?').toUpperCase();
  const [suspending, setSuspending] = useState(false);
  const canManageRoles = currentUserRole === 'owner' && !isCurrentUser && !locked;
  const menuOpen = menuOpenId === user.id;
  const plan = effectivePlan(user);

  async function toggleSuspend() {
    setSuspending(true);
    onMenuToggle(null);
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        gap: 14,
        padding: '17px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        alignItems: 'center',
        position: 'relative',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.028)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      {/* Handle + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: avatarGradient(user.email),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            fontFamily: '"Space Grotesk", sans-serif',
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        {handle ? (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              fontFamily: '"Space Grotesk", sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            @{handle}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.22)' }}>—</span>
            <span
              title="No handle set"
              style={{ color: 'rgba(234,179,8,0.85)', fontSize: 7, lineHeight: 1 }}
            >
              ●
            </span>
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.68)', minWidth: 0 }}>
        {user.name ? (
          <>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {user.name}
            </span>
            {isCurrentUser && (
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)' }}> (you)</span>
            )}
          </>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.22)' }}>—</span>
            <span
              title="No name set"
              style={{ color: 'rgba(234,179,8,0.85)', fontSize: 7, lineHeight: 1 }}
            >
              ●
            </span>
            {isCurrentUser && (
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)' }}>(you)</span>
            )}
          </span>
        )}
      </div>

      {/* Email */}
      <div
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.45)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {user.email}
      </div>

      {/* Joined */}
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)' }}>
        {formatDate(user.createdAt)}
      </div>

      {/* Plan */}
      <div>
        <PlanBadge plan={plan} />
        {user.temporaryAccess && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#E040FB', lineHeight: 1.3 }}>
              ⚡ {user.temporaryAccess.plan.toUpperCase()} until {user.temporaryAccess.until}
            </div>
          </div>
        )}
      </div>

      {/* Role */}
      <div>
        {role ? (
          <RoleBadge role={role} locked={locked} />
        ) : (
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>User</span>
        )}
      </div>

      {/* Status */}
      <div>
        <StatusBadge suspended={user.isSuspended} />
      </div>

      {/* Actions (3-dots) */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle(menuOpen ? null : user.id);
          }}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <DotsIcon />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: 0,
              top: 34,
              zIndex: 50,
              width: 200,
              borderRadius: 12,
              backgroundColor: 'rgba(20,14,40,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              overflow: 'hidden',
              padding: '4px 0',
            }}
          >
            <MenuItem
              icon="✎"
              label="Edit name"
              onClick={() => {
                onMenuToggle(null);
                onEdit(user);
              }}
            />
            <MenuItem
              icon="⚡"
              label="Grant temp access"
              accent="#E040FB"
              onClick={() => {
                onMenuToggle(null);
                alert('Temporary access grants — coming soon.');
              }}
            />

            {canManageRoles && (
              <>
                {role === null && (
                  <MenuItem
                    icon="🛡"
                    label="Make admin"
                    onClick={() => {
                      onMenuToggle(null);
                      onRoleChange(user, 'admin');
                    }}
                  />
                )}
                {role === 'admin' && (
                  <>
                    <MenuItem
                      icon="👑"
                      label="Promote to owner"
                      onClick={() => {
                        onMenuToggle(null);
                        onRoleChange(user, 'owner');
                      }}
                    />
                    <MenuItem
                      icon="✕"
                      label="Revoke admin"
                      danger
                      onClick={() => {
                        onMenuToggle(null);
                        onRoleChange(user, 'none');
                      }}
                    />
                  </>
                )}
                {role === 'owner' && (
                  <MenuItem
                    icon="🛡"
                    label="Demote to admin"
                    onClick={() => {
                      onMenuToggle(null);
                      onRoleChange(user, 'admin');
                    }}
                  />
                )}
              </>
            )}

            <div
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.07)',
                margin: '4px 0',
              }}
            />

            <MenuItem
              icon={user.isSuspended ? '✓' : '⊘'}
              label={suspending ? '…' : user.isSuspended ? 'Reactivate account' : 'Suspend account'}
              danger={!user.isSuspended}
              disabled={suspending}
              onClick={toggleSuspend}
            />
            <MenuItem
              icon="🗑"
              label="Delete user"
              danger
              onClick={() => {
                onMenuToggle(null);
                onDelete(user);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table header ────────────────────────────────────────────────────────────────

const COLS = ['Handle', 'Name', 'Email', 'Joined', 'Plan', 'Role', 'Status', 'Actions'];

function TableHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        gap: 14,
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.18)',
      }}
    >
      {COLS.map((col) => (
        <div
          key={col}
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          {col}
        </div>
      ))}
    </div>
  );
}

// ─── Loading / error / empty ─────────────────────────────────────────────────────

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: ROW_GRID,
            gap: 14,
            padding: '17px 24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            alignItems: 'center',
          }}
        >
          {COLS.map((_, j) => (
            <div
              key={j}
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.07)',
                width: j === 2 ? '90%' : j === 0 ? '80%' : '60%',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function MessageRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.35)',
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}

// ─── Modal shared field ───────────────────────────────────────────────────────────

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

// ─── Modal backdrop ───────────────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────────

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
    <ModalBackdrop onClose={onClose}>
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
    </ModalBackdrop>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────────

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
    <ModalBackdrop onClose={onClose}>
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
    </ModalBackdrop>
  );
}

// ─── Role change modal ────────────────────────────────────────────────────────────

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
    <ModalBackdrop onClose={onClose}>
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
    </ModalBackdrop>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────────

type InviteState = 'idle' | 'sending' | 'sent' | 'error';

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [inviteState, setInviteState] = useState<InviteState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteState('sending');
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
        setInviteState('error');
        return;
      }
      setInviteState('sent');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setInviteState('error');
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="w-full max-w-sm rounded-xl p-6"
        style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {inviteState === 'sent' ? (
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
              {inviteState === 'error' && (
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
                  disabled={inviteState === 'sending'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={inviteState === 'sending' || !email.trim()}
                >
                  {inviteState === 'sending' ? 'Sending…' : 'Send invite'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </ModalBackdrop>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────────

export function UsersTable({
  roles: initialRoles,
  lockedOwnerEmails: initialLockedEmails,
  currentUserEmail,
}: {
  roles: RolesMap;
  lockedOwnerEmails: string[];
  currentUserEmail: string;
}) {
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' });
  const [modal, setModal] = useState<ActiveModal>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roles, setRoles] = useState<RolesMap>(initialRoles);
  const [lockedEmails, setLockedEmails] = useState<Set<string>>(
    new Set(initialLockedEmails.map((e) => e.toLowerCase())),
  );

  const currentUserRole = roles[currentUserEmail.toLowerCase()] ?? null;

  // Close action menu on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    function handleClose() {
      setMenuOpenId(null);
    }
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [menuOpenId]);

  // Fetch users
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
        if (!cancelled) setFetchState({ status: 'ok', users });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setFetchState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load users.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateUser(updated: AdminUser) {
    setFetchState((prev) => {
      if (prev.status !== 'ok') return prev;
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      };
    });
  }

  function removeUser(id: string) {
    setFetchState((prev) => {
      if (prev.status !== 'ok') return prev;
      return { ...prev, users: prev.users.filter((u) => u.id !== id) };
    });
  }

  function handleStatusChange(id: string, isSuspended: boolean) {
    setFetchState((prev) => {
      if (prev.status !== 'ok') return prev;
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, isSuspended } : u)),
      };
    });
  }

  const handleRolesUpdated = useCallback((newRoles: RolesMap, newLocked: string[]) => {
    setRoles(newRoles);
    setLockedEmails(new Set(newLocked.map((e) => e.toLowerCase())));
  }, []);

  const allUsers = fetchState.status === 'ok' ? fetchState.users : [];

  // KPI counts (computed from full user list, not filtered)
  const kpiTotal = allUsers.length;
  const kpiActive = allUsers.filter((u) => !u.isSuspended).length;
  const kpiProPlus = allUsers.filter((u) => effectivePlan(u) === 'pro+').length;
  const kpiNew30d = allUsers.filter((u) => isWithin30Days(u.createdAt)).length;

  // Apply filters
  const filteredUsers = allUsers.filter((u) => {
    if (!matchesSearch(u, search.trim())) return false;
    if (planFilter !== 'all' && effectivePlan(u) !== planFilter) return false;
    if (roleFilter !== 'all') {
      const emailKey = u.email.toLowerCase();
      const role = roles[emailKey] ?? null;
      if (roleFilter === 'owner' && role !== 'owner') return false;
      if (roleFilter === 'admin' && role !== 'admin') return false;
      if (roleFilter === 'user' && role !== null) return false;
    }
    if (statusFilter === 'active' && u.isSuspended) return false;
    if (statusFilter === 'suspended' && !u.isSuspended) return false;
    return true;
  });

  const isFiltered =
    search.trim() || planFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all';
  const countLabel =
    fetchState.status === 'loading'
      ? 'Loading…'
      : fetchState.status === 'error'
        ? 'Could not load user data.'
        : isFiltered
          ? `${filteredUsers.length} of ${allUsers.length} users`
          : `${allUsers.length} ${allUsers.length === 1 ? 'user' : 'users'} registered`;

  return (
    <>
      {/* Modals */}
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

      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '36px 0 20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#E040FB',
              marginBottom: 8,
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            BEHIND THE STAGE · ADMIN
          </p>
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              fontFamily: '"Space Grotesk", sans-serif',
              margin: 0,
            }}
          >
            <span style={{ color: '#fff' }}>Registered </span>
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              users.
            </span>
          </h1>
          <p
            style={{
              marginTop: 10,
              fontSize: 15,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.55,
              maxWidth: 460,
            }}
          >
            All registered StageLink accounts. Manage roles, status and temporary access from here.
          </p>
        </div>

        <button
          onClick={() => setModal({ type: 'invite' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 999,
            background: GRADIENT,
            border: 'none',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(224,64,251,0.3)',
            flexShrink: 0,
            fontFamily: '"Space Grotesk", sans-serif',
          }}
        >
          + Invite user
        </button>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 16,
          marginBottom: 24,
        }}
        className="grid-cols-2 sm:grid-cols-4"
      >
        <KpiTile
          label="Total users"
          value={kpiTotal}
          accent="#E040FB"
          caption="Registered accounts"
          icon="👥"
        />
        <KpiTile
          label="Active"
          value={kpiActive}
          accent="#4ADE80"
          caption={`${kpiTotal - kpiActive} suspended`}
          icon="✓"
        />
        <KpiTile
          label="PRO+ effective"
          value={kpiProPlus}
          accent="#9B30D0"
          caption="Paid + temporary grants"
          icon="⚡"
        />
        <KpiTile
          label="New · 30 days"
          value={kpiNew30d}
          accent="#00D4FF"
          caption="Joined this month"
          icon="🆕"
        />
      </div>

      {/* ── Table panel ────────────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: '20px 24px 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: '"Space Grotesk", sans-serif',
                  margin: 0,
                }}
              >
                Registered users
              </h2>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {countLabel}
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)',
                pointerEvents: 'none',
                display: 'flex',
              }}
            >
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, handle or email…"
              style={{
                width: '100%',
                padding: '9px 36px 9px 36px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.28)',
                color: '#fff',
                fontSize: 13.5,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              paddingBottom: 14,
              overflowX: 'auto',
              flexWrap: 'wrap',
            }}
          >
            <FilterGroup
              label="Plan"
              value={planFilter}
              onChange={setPlanFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'PRO' },
                { value: 'pro+', label: 'PRO+' },
              ]}
            />
            <FilterGroup
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'owner', label: 'Owner' },
                { value: 'admin', label: 'Admin' },
                { value: 'user', label: 'User' },
              ]}
            />
            <FilterGroup
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'active' },
                { value: 'suspended', label: 'suspended' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            <TableHeader />

            {fetchState.status === 'loading' && <LoadingRows />}

            {fetchState.status === 'error' && (
              <MessageRow>
                <span style={{ color: 'rgba(255,80,80,0.8)' }}>{fetchState.message}</span>
              </MessageRow>
            )}

            {fetchState.status === 'ok' && filteredUsers.length === 0 && (
              <MessageRow>
                <span style={{ fontSize: 22, display: 'block', marginBottom: 8 }}>🔍</span>
                {search.trim()
                  ? `No users matching "${search.trim()}".`
                  : 'No users match these filters.'}
              </MessageRow>
            )}

            {fetchState.status === 'ok' &&
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
                    menuOpenId={menuOpenId}
                    onMenuToggle={setMenuOpenId}
                    onStatusChange={handleStatusChange}
                    onEdit={(user) => setModal({ type: 'edit', user })}
                    onDelete={(user) => setModal({ type: 'delete', user })}
                    onRoleChange={(user, newRole) => setModal({ type: 'role', user, newRole })}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
