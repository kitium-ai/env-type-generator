import { fileURLToPath } from 'node:url';
import { baseConfig, nodeConfig, typeScriptConfig } from '@kitiumai/lint/eslint';

const tsconfigPath = fileURLToPath(new URL('./tsconfig.eslint.json', import.meta.url));
const tsconfigRoot = fileURLToPath(new URL('./', import.meta.url));

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    languageOptions: {
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: tsconfigRoot,
      },
    },
  },
  ...baseConfig,
  ...nodeConfig,
  ...typeScriptConfig,
  {
    name: 'env-type-generator-overrides',
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: tsconfigRoot,
      },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      complexity: 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    name: 'env-type-generator-tests',
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: tsconfigRoot,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/require-await': 'off',
    },
  },
];
