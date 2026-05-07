import { UsersTable } from './UsersTable';
import { BEHIND_OWNER_EMAILS } from '@/lib/behind-config';

export default function BehindTheStagePage() {
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

      <UsersTable adminEmails={[...BEHIND_OWNER_EMAILS]} />
    </div>
  );
}
