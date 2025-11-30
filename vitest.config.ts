import { createKitiumVitestConfig } from '@kitiumai/vitest-helpers/config';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

export default defineConfig(
  createKitiumVitestConfig({
    preset: 'library',
    setupFiles: ['src/test/vitest.setup.ts'],
    // Provide alias to stub logger implementation to avoid missing internal file
    resolve: {
      alias: {
        '@kitiumai/logger': fileURLToPath(new URL('./src/test/logger-stub.ts', import.meta.url)),
      },
    },
    overrides: {
      test: {
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        coverage: {
          reporter: ['text', 'html', 'lcov'],
          reportsDirectory: 'coverage',
          include: ['src/**/*.ts'],
          exclude: [
            'dist/**',
            'src/cli.ts',
            'src/index.ts',
            'src/**/*.d.ts',
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
            'src/test/**',
            'example/**',
            'src/logger.ts',
            'src/types/**',
            'src/services/file-watcher.ts',
          ],
          thresholds: {
            branches: 70,
            functions: 95,
            lines: 90,
            statements: 90,
          },
        },
      },
    },
  })
);
