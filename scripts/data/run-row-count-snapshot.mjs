#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const CRITICAL_TABLES = [
  'users',
  'artists',
  'artist_memberships',
  'pages',
  'blocks',
  'subscribers',
  'analytics_events',
  'assets',
  'subscriptions',
  'custom_domains',
  'smart_links',
  'epks',
  'stripe_webhook_events',
  'shopify_connections',
  'merch_provider_connections',
  'artist_platform_insights_connections',
  'artist_platform_insights_snapshots',
];

const args = parseArgs(process.argv.slice(2));
const databaseUrl = args.databaseUrl ?? process.env.DATABASE_URL;
const outputPath = args.output ?? process.env.DATA_ROW_COUNTS_OUTPUT;
const allowProduction = args.allowProduction || process.env.DATA_ALLOW_PRODUCTION === 'true';

if (!databaseUrl) {
  fail('DATABASE_URL is required. Pass --database-url or set DATABASE_URL.');
}

if (looksProductionLike(databaseUrl) && !allowProduction) {
  fail('Refusing to snapshot a production-like database without DATA_ALLOW_PRODUCTION=true.');
}

const sql = buildRowCountSql(CRITICAL_TABLES);
const result = spawnSync(
  'psql',
  [databaseUrl, '--no-psqlrc', '--set', 'ON_ERROR_STOP=1', '--csv', '--tuples-only'],
  {
    input: sql,
    encoding: 'utf8',
  },
);

if (result.error) {
  fail(`Unable to run psql: ${result.error.message}`);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const tables = parseCsvRows(result.stdout);
const totalRows = tables.reduce((sum, table) => sum + table.rowCount, 0);
const snapshot = {
  capturedAt: new Date().toISOString(),
  database: redactDatabaseUrl(databaseUrl),
  tableCount: tables.length,
  totalRows,
  tables,
};

if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
}

console.log(`StageLink row-count snapshot: ${tables.length} tables, ${totalRows} total rows`);
console.table(tables);

function buildRowCountSql(tables) {
  return tables
    .map((table, index) => {
      const quotedTable = quoteIdentifier(table);
      return `SELECT ${index} AS ordinal, '${table}' AS table_name, COUNT(*)::bigint AS row_count FROM public.${quotedTable}`;
    })
    .join('\nUNION ALL\n')
    .concat('\nORDER BY ordinal;\n');
}

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--allow-production') {
      parsed.allowProduction = true;
      continue;
    }

    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      index++;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

function parseCsvRows(stdout) {
  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [ordinal, tableName, rowCount] = line.split(',');
      return {
        ordinal: Number(ordinal),
        tableName,
        rowCount: Number(rowCount),
      };
    });
}

function looksProductionLike(url) {
  return /railway\.app|amazonaws\.com|supabase\.co|render\.com|neon\.tech|prod|production/i.test(
    url,
  );
}

function redactDatabaseUrl(url) {
  return url.replace(/:\/\/([^:@]+):([^@]+)@/, '://$1:[redacted]@');
}

function fail(message) {
  console.error(`Row-count snapshot error: ${message}`);
  process.exit(1);
}
