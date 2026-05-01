import type { PrismaService } from '../lib/prisma.service';

const TEST_DATABASE_PATTERN = /(localhost|127\.0\.0\.1).*(stagelink_test|postgres)/;

export const RESET_TABLES = [
  'analytics_events',
  'artist_platform_insights_snapshots',
  'audit_logs',
  'stripe_webhook_events',
  'subscribers',
  'blocks',
  'pages',
  'custom_domains',
  'subscriptions',
  'shopify_connections',
  'merch_provider_connections',
  'artist_platform_insights_connections',
  'smart_links',
  'assets',
  'epks',
  'artist_memberships',
  'artists',
  'users',
] as const;

export function assertSafeIntegrationDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv !== 'test' || !TEST_DATABASE_PATTERN.test(databaseUrl)) {
    throw new Error(
      'Integration tests require NODE_ENV=test and a local test DATABASE_URL. Refusing to reset database.',
    );
  }
}

export async function resetIntegrationDatabase(prisma: PrismaService): Promise<void> {
  assertSafeIntegrationDatabase();

  const tableList = RESET_TABLES.map((table) => `"${table}"`).join(',\n      ');

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      ${tableList}
    RESTART IDENTITY CASCADE
  `);
}
