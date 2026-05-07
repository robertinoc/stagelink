#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRequire = createRequire(resolve(__dirname, '../../apps/api/package.json'));
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
const findings = await runIntegritySql(sql);
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

async function runIntegritySql(sql) {
  const psqlResult = runWithPsql(sql);
  if (psqlResult.status === 'success') {
    return parseCsvRows(psqlResult.stdout);
  }

  if (psqlResult.status === 'error' && psqlResult.code !== 'ENOENT') {
    fail(`Unable to run psql: ${psqlResult.message}`);
  }

  if (psqlResult.status === 'failed') {
    process.stderr.write(psqlResult.stderr);
    process.exit(psqlResult.exitCode ?? 1);
  }

  return runWithPrisma(sql);
}

function runWithPsql(sql) {
  const result = spawnSync(
    'psql',
    [databaseUrl, '--no-psqlrc', '--set', 'ON_ERROR_STOP=1', '--csv', '--tuples-only'],
    {
      input: sql,
      encoding: 'utf8',
    },
  );

  if (result.error) {
    return {
      status: 'error',
      code: result.error.code,
      message: result.error.message,
    };
  }

  if (result.status !== 0) {
    return {
      status: 'failed',
      exitCode: result.status,
      stderr: result.stderr,
    };
  }

  return {
    status: 'success',
    stdout: result.stdout,
  };
}

async function runWithPrisma(sql) {
  let PrismaClient;
  try {
    ({ PrismaClient } = apiRequire('@prisma/client'));
  } catch (error) {
    fail(`Unable to run psql and unable to load @prisma/client fallback: ${error.message}`);
  }

  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRawUnsafe(sql);
    return rows.map((row) => ({
      checkName: row.check_name,
      severity: row.severity,
      issueCount: Number(row.issue_count),
    }));
  } catch (error) {
    fail(`Unable to run data integrity SQL with Prisma fallback: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
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
