import baseConfig from '@kitiumai/config/eslint.config.base.js';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  {
    name: 'env-type-generator-overrides',
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'off', // CLI tool needs console output
      'no-restricted-imports': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      complexity: 'off', // Generator logic can be complex
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    name: 'env-type-generator-tests',
    files: ['src/**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
];
