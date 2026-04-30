import type { PrismaService } from '../lib/prisma.service';

const TEST_DATABASE_PATTERN = /(localhost|127\.0\.0\.1).*(stagelink_test|postgres)/;

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

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "analytics_events",
      "audit_logs",
      "subscribers",
      "blocks",
      "pages",
      "custom_domains",
      "subscriptions",
      "artist_memberships",
      "artists",
      "users"
    RESTART IDENTITY CASCADE
  `);
}
