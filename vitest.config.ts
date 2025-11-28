import { createKitiumVitestConfig } from '@kitiumai/vitest-helpers/config';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  createKitiumVitestConfig({
    preset: 'library',
    setupFiles: ['src/test/vitest.setup.ts'],
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
      resolve: {
        alias: {
          '@kitiumai/logger': '@kitiumai/logger/dist/cjs/index.js',
        },
      },
    },
  })
);
