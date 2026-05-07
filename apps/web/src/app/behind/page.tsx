import { UsersTable } from './UsersTable';
import { getMergedRoles } from '@/lib/behind-redis';
import { BEHIND_OWNER_EMAILS } from '@/lib/behind-config';
import { getSession } from '@/lib/auth';

export default async function BehindTheStagePage() {
  const [roles, session] = await Promise.all([getMergedRoles(), getSession()]);

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-semibold font-[family-name:var(--font-heading)]"
          style={{ color: 'var(--foreground)' }}
        >
          Users
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          All registered StageLink accounts.
        </p>
      </div>

      <UsersTable
        roles={roles}
        lockedOwnerEmails={[...BEHIND_OWNER_EMAILS]}
        currentUserEmail={session?.user.email ?? ''}
      />
    </div>
  );
}
