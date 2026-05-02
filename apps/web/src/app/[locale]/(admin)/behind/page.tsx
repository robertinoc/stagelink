import { UsersTable } from './UsersTable';

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

      <UsersTable />
    </div>
  );
}
