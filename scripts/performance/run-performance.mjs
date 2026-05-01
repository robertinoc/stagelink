#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';

const PROFILES = {
  load: {
    description: 'Expected launch load: steady multi-user traffic.',
    durationMs: 30_000,
    virtualUsers: 20,
    thresholds: { maxErrorRate: 0.01, maxP95Ms: 1_000 },
  },
  stress: {
    description: 'Breakpoint discovery: intentionally pushes beyond normal load.',
    stages: [
      { durationMs: 15_000, virtualUsers: 10 },
      { durationMs: 15_000, virtualUsers: 25 },
      { durationMs: 15_000, virtualUsers: 50 },
      { durationMs: 15_000, virtualUsers: 100 },
    ],
    thresholds: { maxErrorRate: 0.05, maxP95Ms: 2_500 },
  },
  scalability: {
    description: 'Capacity curve: compares latency as traffic increases.',
    stages: [
      { durationMs: 20_000, virtualUsers: 5 },
      { durationMs: 20_000, virtualUsers: 20 },
      { durationMs: 20_000, virtualUsers: 50 },
    ],
    thresholds: { maxErrorRate: 0.03, maxP95Ms: 1_800 },
  },
};

const args = parseArgs(process.argv.slice(2));
const profileName = args.profile ?? 'load';
const profile = PROFILES[profileName];

if (!profile) {
  fail(`Unknown profile "${profileName}". Use one of: ${Object.keys(PROFILES).join(', ')}`);
}

const webBaseUrl = trimTrailingSlash(args.webUrl ?? process.env.PERF_WEB_URL ?? '');
const apiBaseUrl = trimTrailingSlash(args.apiUrl ?? process.env.PERF_API_URL ?? '');
const demoArtist = args.demoArtist ?? process.env.PERF_DEMO_ARTIST;
const smartLinkId = args.smartLinkId ?? process.env.PERF_SMART_LINK_ID;
const authToken = args.authToken ?? process.env.PERF_AUTH_TOKEN;
const outputPath = args.output ?? process.env.PERF_OUTPUT;
const dryRun = Boolean(args.dryRun);

if (!webBaseUrl && !apiBaseUrl) {
  fail('Set PERF_WEB_URL and/or PERF_API_URL, or pass --web-url / --api-url.');
}

enforceProductionStressGuard(profileName, webBaseUrl, apiBaseUrl);

const routes = buildRoutes({
  webBaseUrl,
  apiBaseUrl,
  demoArtist,
  smartLinkId,
  authToken,
});

if (routes.length === 0) {
  fail('No routes were configured. Check PERF_WEB_URL/PERF_API_URL and optional IDs.');
}

if (dryRun) {
  printPlan(profileName, profile, routes);
  process.exit(0);
}

const result = await runProfile(profileName, profile, routes);
printSummary(result);

if (outputPath) {
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

if (!result.passed) {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--dry-run') {
      parsed.dryRun = true;
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

function buildRoutes({ webBaseUrl, apiBaseUrl, demoArtist, smartLinkId, authToken }) {
  const routes = [];

  if (webBaseUrl) {
    routes.push({
      name: 'web-home',
      url: `${webBaseUrl}/`,
      weight: 3,
      expectedStatuses: [200],
    });

    if (demoArtist) {
      routes.push({
        name: 'web-public-artist',
        url: `${webBaseUrl}/${encodeURIComponent(demoArtist)}`,
        weight: 5,
        expectedStatuses: [200, 404],
        headers: qaHeaders(),
      });
    }

    if (smartLinkId) {
      routes.push({
        name: 'web-smart-link-redirect',
        url: `${webBaseUrl}/go/${encodeURIComponent(smartLinkId)}`,
        weight: 2,
        expectedStatuses: [302, 404, 429],
        redirect: 'manual',
        headers: qaHeaders(),
      });
    }
  }

  if (apiBaseUrl) {
    routes.push({
      name: 'api-health',
      url: `${apiBaseUrl}/api/health`,
      weight: 3,
      expectedStatuses: [200],
    });

    if (demoArtist) {
      routes.push({
        name: 'api-public-page',
        url: `${apiBaseUrl}/api/public/pages/by-username/${encodeURIComponent(demoArtist)}?locale=en`,
        weight: 5,
        expectedStatuses: [200, 404, 429],
        headers: qaHeaders(),
      });

      routes.push({
        name: 'api-public-epk',
        url: `${apiBaseUrl}/api/public/epk/by-username/${encodeURIComponent(demoArtist)}?locale=en`,
        weight: 1,
        expectedStatuses: [200, 404, 429],
        headers: qaHeaders(),
      });
    }

    if (smartLinkId) {
      routes.push({
        name: 'api-smart-link-resolve',
        url: `${apiBaseUrl}/api/public/smart-links/${encodeURIComponent(smartLinkId)}/resolve?platform=desktop`,
        weight: 2,
        expectedStatuses: [200, 404, 429],
        headers: qaHeaders(),
      });
    }

    if (authToken) {
      routes.push({
        name: 'api-auth-me',
        url: `${apiBaseUrl}/api/auth/me`,
        weight: 2,
        expectedStatuses: [200],
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    }
  }

  return expandWeightedRoutes(routes);
}

function qaHeaders() {
  return {
    'X-SL-QA': '1',
    'User-Agent': 'StageLinkPerformanceTest/1.0',
  };
}

function expandWeightedRoutes(routes) {
  return routes.flatMap((route) => Array.from({ length: route.weight }, () => route));
}

async function runProfile(profileName, profile, routes) {
  const startedAt = new Date().toISOString();
  const stages = profile.stages ?? [
    {
      durationMs: Number(args.durationMs ?? profile.durationMs),
      virtualUsers: Number(args.vus ?? profile.virtualUsers),
    },
  ];

  const stageResults = [];

  for (let index = 0; index < stages.length; index++) {
    const stage = stages[index];
    const stageResult = await runStage({
      routes,
      stage,
      stageName: `${profileName}-${index + 1}`,
    });
    stageResults.push(stageResult);
  }

  const aggregate = summarizeSamples(
    stageResults.flatMap((stage) => stage.samples),
    stageResults.reduce((sum, stage) => sum + stage.elapsedSeconds, 0),
  );
  const passed =
    aggregate.errorRate <= profile.thresholds.maxErrorRate &&
    aggregate.p95Ms <= profile.thresholds.maxP95Ms;

  return {
    profile: profileName,
    description: profile.description,
    startedAt,
    finishedAt: new Date().toISOString(),
    thresholds: profile.thresholds,
    target: {
      webBaseUrl: webBaseUrl || null,
      apiBaseUrl: apiBaseUrl || null,
      demoArtist: demoArtist || null,
      smartLinkId: smartLinkId || null,
      authenticated: Boolean(authToken),
    },
    routes: summarizeRoutes(routes),
    stages: stageResults.map(({ samples: _samples, ...stage }) => stage),
    aggregate,
    passed,
  };
}

async function runStage({ routes, stage, stageName }) {
  const started = performance.now();
  const endAt = performance.now() + stage.durationMs;
  const samples = [];
  const workers = Array.from({ length: stage.virtualUsers }, (_, workerId) =>
    runWorker({ workerId, routes, endAt, samples }),
  );

  await Promise.all(workers);

  const elapsedSeconds = Math.max(0.001, (performance.now() - started) / 1000);
  const summary = summarizeSamples(samples, elapsedSeconds);
  return {
    name: stageName,
    durationMs: stage.durationMs,
    elapsedSeconds,
    virtualUsers: stage.virtualUsers,
    ...summary,
    samples,
  };
}

async function runWorker({ workerId, routes, endAt, samples }) {
  let cursor = workerId % routes.length;

  while (performance.now() < endAt) {
    const route = routes[cursor % routes.length];
    cursor++;
    samples.push(await requestRoute(route));
  }
}

async function requestRoute(route) {
  const started = performance.now();
  let status = 0;
  let ok = false;
  let error = null;

  try {
    const response = await fetch(route.url, {
      method: 'GET',
      headers: route.headers,
      redirect: route.redirect ?? 'follow',
      cache: 'no-store',
    });
    status = response.status;
    ok = route.expectedStatuses.includes(status);

    await response.arrayBuffer();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return {
    route: route.name,
    status,
    ok,
    latencyMs: Math.round((performance.now() - started) * 100) / 100,
    error,
  };
}

function summarizeSamples(samples, elapsedSeconds) {
  const latencies = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  const failures = samples.filter((sample) => !sample.ok).length;
  const statusCounts = {};
  const routeCounts = {};

  for (const sample of samples) {
    statusCounts[sample.status] = (statusCounts[sample.status] ?? 0) + 1;
    routeCounts[sample.route] = (routeCounts[sample.route] ?? 0) + 1;
  }

  const durationSeconds = elapsedSeconds ?? 0.001;

  return {
    requests: samples.length,
    failures,
    errorRate: samples.length ? failures / samples.length : 0,
    minMs: percentile(latencies, 0),
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    maxMs: percentile(latencies, 100),
    averageMs: average(latencies),
    approximateRps: Math.round((samples.length / durationSeconds) * 100) / 100,
    statusCounts,
    routeCounts,
  };
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function average(values) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function summarizeRoutes(routes) {
  const uniqueRoutes = new Map();
  for (const route of routes) {
    uniqueRoutes.set(route.name, {
      name: route.name,
      url: redactUrl(route.url),
      expectedStatuses: route.expectedStatuses,
      weight: (uniqueRoutes.get(route.name)?.weight ?? 0) + 1,
    });
  }
  return [...uniqueRoutes.values()];
}

function redactUrl(url) {
  return url.replace(/([?&](token|key|secret)=)[^&]+/gi, '$1[redacted]');
}

function printPlan(profileName, profile, routes) {
  console.log(`StageLink performance plan: ${profileName}`);
  console.log(profile.description);
  console.log('');
  console.table(summarizeRoutes(routes));
}

function printSummary(result) {
  console.log(`\nStageLink performance result: ${result.profile}`);
  console.log(`Passed: ${result.passed ? 'yes' : 'no'}`);
  console.log(
    `Requests: ${result.aggregate.requests} | failures: ${result.aggregate.failures} | error rate: ${formatPercent(result.aggregate.errorRate)}`,
  );
  console.log(
    `Latency: p50 ${result.aggregate.p50Ms}ms | p95 ${result.aggregate.p95Ms}ms | p99 ${result.aggregate.p99Ms}ms | max ${result.aggregate.maxMs}ms`,
  );
  console.log(`Approx RPS: ${result.aggregate.approximateRps}`);
  console.log('');
  console.table(
    result.stages.map((stage) => ({
      stage: stage.name,
      vus: stage.virtualUsers,
      requests: stage.requests,
      failures: stage.failures,
      errorRate: formatPercent(stage.errorRate),
      p95Ms: stage.p95Ms,
      p99Ms: stage.p99Ms,
      maxMs: stage.maxMs,
    })),
  );
}

function formatPercent(value) {
  return `${Math.round(value * 10_000) / 100}%`;
}

function enforceProductionStressGuard(profileName, ...urls) {
  const isStressy = profileName === 'stress' || profileName === 'scalability';
  if (!isStressy) return;

  const targetsProduction = urls
    .filter(Boolean)
    .some((url) => /stagelink\.link|stagelink\.art|railway\.app/.test(url));

  if (targetsProduction && process.env.PERF_ALLOW_PROD_STRESS !== 'true') {
    fail(
      `${profileName} targets production-like URLs. Set PERF_ALLOW_PROD_STRESS=true only during an approved test window.`,
    );
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function fail(message) {
  console.error(`Performance runner error: ${message}`);
  process.exit(1);
}
