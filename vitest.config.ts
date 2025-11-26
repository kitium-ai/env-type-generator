import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const { createCustomPreset } = await import('../vitest-helpers/dist/setup/presets.js');

  const preset = createCustomPreset('library', {
    test: {
      include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      setupFiles: ['src/test/vitest.setup.ts'],
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
  });

  return preset;
});
