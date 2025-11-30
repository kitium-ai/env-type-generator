import baseConfig from '@kitiumai/config/eslint.config.base.js';
import { createKitiumConfig } from '@kitiumai/lint';

export default createKitiumConfig({
  baseConfig,
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**', '**/*.d.ts'],
  additionalRules: {
    'no-console': 'off', // CLI tool needs console output
    'no-restricted-imports': 'off', // Allow local module imports
    'max-lines-per-function': 'off',
    'max-statements': 'off',
    complexity: 'off', // Generator logic can be complex
    '@typescript-eslint/no-require-imports': 'off', // CLI dynamic imports
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/require-await': 'off',
  },
  overrides: [
    {
      files: ['**/*'],
      rules: {
        'no-restricted-imports': 'off', // Global disable for this package
      },
    },
    {
      files: ['src/cli.ts'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off', // Dynamic config loading
      },
    },
    {
      files: ['src/**/*.test.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },
  ],
});
