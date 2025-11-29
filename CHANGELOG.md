# Changelog

All notable changes to `@kitiumai/env-type-generator` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-24

### Changed

- Migrated the package to native ESM (`"type": "module"`) with Node16 module resolution for full compatibility with other internal ESM packages such as `@kitiumai/types`, `@kitiumai/logger`, and `@kitiumai/utils-ts`.
- Updated all internal relative imports to include explicit `.js` extensions so emitted ESM bundles resolve correctly at runtime.
- Replaced Jest with Vitest using the shared `@kitiumai/vitest-helpers` presets and setup so tests run consistently across packages without custom glue code.
- Adopted the shared ESLint base plus dedicated `tsconfig.eslint.json` to enable type-aware linting of both source and test files.
- Refactored the generator service and file watcher tests to be more deterministic (explicit timers, logger mocks, typed callbacks) which keeps the Vitest suite stable in watch mode.
- Hardened the shared logger wrapper to load `@kitiumai/logger` as an ES module and added safer Loki configuration naming to satisfy strict lint rules.

### Added

- Dedicated `vitest.config.ts` and `src/test/vitest.setup.ts` so consumers can run `pnpm test`/`pnpm test:watch` out of the box with Vitest.
- `tsconfig.eslint.json` to give ESLint/TypeScript the same view of the source tree (tests included) without affecting the production compiler config.

[2.0.0]: https://github.com/kitium-ai/env-type-generator/releases/tag/v2.0.0
