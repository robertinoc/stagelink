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
const outputPath = args.output ?? process.env.DATA_RETENTION_CANDIDATES_OUTPUT;
const allowProduction = args.allowProduction || process.env.DATA_ALLOW_PRODUCTION === 'true';
const sqlPath = resolve(__dirname, 'retention-candidates.sql');

if (!databaseUrl) {
  fail('DATABASE_URL is required. Pass --database-url or set DATABASE_URL.');
}

if (looksProductionLike(databaseUrl) && !allowProduction) {
  fail('Refusing to inspect a production-like database without DATA_ALLOW_PRODUCTION=true.');
}

const sql = readFileSync(sqlPath, 'utf8');
const candidates = await runRetentionSql(sql);
const totalCandidates = candidates.reduce((sum, row) => sum + row.candidateCount, 0);
const summary = {
  checkedAt: new Date().toISOString(),
  database: redactDatabaseUrl(databaseUrl),
  mode: 'dry-run-read-only',
  totalCandidates,
  candidates,
};

if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

console.log(
  `StageLink retention candidates: ${totalCandidates} candidate rows across ${candidates.length} groups`,
);
console.table(candidates);

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
      const [candidateGroup, tableName, candidateCount, recommendedAction] = line.split(',');
      return {
        candidateGroup,
        tableName,
        candidateCount: Number(candidateCount),
        recommendedAction,
      };
    });
}

async function runRetentionSql(sql) {
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
      candidateGroup: row.candidate_group,
      tableName: row.table_name,
      candidateCount: Number(row.candidate_count),
      recommendedAction: row.recommended_action,
    }));
  } catch (error) {
    fail(`Unable to run retention candidate SQL with Prisma fallback: ${error.message}`);
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
  console.error(`Retention candidate runner error: ${message}`);
  process.exit(1);
}
