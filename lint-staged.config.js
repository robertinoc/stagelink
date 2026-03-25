/** @type {import('lint-staged').Config} */
export default {
  // Prettier runs at root (installed here). ESLint runs per-workspace via `pnpm lint`.
  '**/*.{ts,tsx,js,jsx,json,md,yaml,yml,css}': ['prettier --write'],
};
