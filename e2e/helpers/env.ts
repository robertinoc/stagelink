import { test } from '@playwright/test';

export function requireEnv(name: string): string {
  const value = process.env[name];
  test.skip(!value, `${name} is required for this E2E journey`);
  return value!;
}

export function isMutationEnabled(name: string): boolean {
  return process.env[name] === 'true';
}
