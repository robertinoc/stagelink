import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const isCI = !!process.env.CI;

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'web',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    reporters: isCI ? ['default', 'junit'] : 'default',
    outputFile: isCI ? { junit: './test-results/junit.xml' } : undefined,
    passWithNoTests: true,
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.d.ts',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
        'src/instrumentation*.ts',
      ],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
      reporter: ['text', 'lcov', 'json', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@stagelink/types': path.resolve(__dirname, '../../packages/types/src'),
      '@stagelink/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
});
