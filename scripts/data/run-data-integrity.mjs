#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const databaseUrl = args.databaseUrl ?? process.env.DATABASE_URL;
const outputPath = args.output ?? process.env.DATA_INTEGRITY_OUTPUT;
const allowProduction = args.allowProduction || process.env.DATA_ALLOW_PRODUCTION === 'true';
const sqlPath = resolve(__dirname, 'data-integrity.sql');

if (!databaseUrl) {
  fail('DATABASE_URL is required. Pass --database-url or set DATABASE_URL.');
}

if (looksProductionLike(databaseUrl) && !allowProduction) {
  fail('Refusing to validate a production-like database without DATA_ALLOW_PRODUCTION=true.');
}

const sql = readFileSync(sqlPath, 'utf8');
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

const findings = parseCsvRows(result.stdout);
const summary = {
  checkedAt: new Date().toISOString(),
  database: redactDatabaseUrl(databaseUrl),
  status: findings.length === 0 ? 'pass' : 'fail',
  findings,
};

if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

if (findings.length === 0) {
  console.log('StageLink data integrity: pass (0 findings)');
  process.exit(0);
}

console.log(`StageLink data integrity: fail (${findings.length} finding groups)`);
console.table(findings);
process.exit(1);

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
      const [checkName, severity, issueCount] = line.split(',');
      return {
        checkName,
        severity,
        issueCount: Number(issueCount),
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
  console.error(`Data integrity runner error: ${message}`);
  process.exit(1);
}
