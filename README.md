# env-type-generator

[![npm version](https://badge.fury.io/js/@kitiumai%2Fenv-type-generator.svg)](https://www.npmjs.com/package/@kitiumai/env-type-generator)
[![CI](https://github.com/kitium-ai/env-type-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/kitium-ai/env-type-generator/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dm/@kitiumai/env-type-generator.svg)](https://www.npmjs.com/package/@kitiumai/env-type-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/kitium-ai/env-type-generator/pulls)
[![GitHub stars](https://img.shields.io/github/stars/kitium-ai/env-type-generator.svg?style=social)](https://github.com/kitium-ai/env-type-generator)

> **Zero-config TypeScript type generator for .env files** with Zod validation, watch mode, and IDE autocomplete

Stop writing types for `process.env` manually. Let `env-type-generator` do it for you!

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Examples](#examples)
- [Framework Integration](#framework-integration)
- [CI/CD Integration](#cicd-integration)
- [GitHub Actions](#github-actions)
- [Configuration](#configuration)
- [API](#api)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- ✅ **Zero Config** - Works out of the box with sensible defaults
- ✅ **Auto-Generation** - Generates TypeScript types from existing .env files
- ✅ **Type Inference** - Optionally infer types (string, number, boolean, object)
- ✅ **Runtime Validation** - Generate Zod/Yup/Joi schemas for runtime validation
- ✅ **Watch Mode** - Auto-regenerate on file changes
- ✅ **Multiple Files** - Support for .env, .env.local, .env.production, etc.
- ✅ **Framework Agnostic** - Works with any TypeScript project
- ✅ **IDE Autocomplete** - Get IntelliSense for `process.env`

## Installation

```bash
npm install --save-dev @kitiumai/env-type-generator

# or
yarn add -D @kitiumai/env-type-generator

# or
pnpm add -D @kitiumai/env-type-generator
```

## Quick Start

### 1. Create your .env file

```env
# Database
DATABASE_URL=postgresql://localhost:5432/mydb
DATABASE_POOL_SIZE=10

# API Keys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Features
ENABLE_ANALYTICS=true
MAX_UPLOAD_SIZE_MB=50
```

### 2. Generate types

```bash
npx env-type-gen
```

### 3. Use type-safe environment variables

```typescript
// TypeScript knows about your env vars!
const dbUrl: string = process.env.DATABASE_URL; // Autocomplete works!
const poolSize: number = env.DATABASE_POOL_SIZE; // Parsed as number

// ❌ TypeScript will catch typos
const invalid = process.env.DATABSE_URL; // Error: Property 'DATABSE_URL' does not exist
```

## Usage

### CLI Options

```bash
npx env-type-gen [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-e, --env-files <files...>` | Environment files to parse | `.env` |
| `-o, --output <path>` | Output path for type definitions | `./src/types/env.d.ts` |
| `-v, --validation-lib <library>` | Validation library (zod\|yup\|joi\|none) | `none` |
| `-s, --validation-output <path>` | Output path for validation schema | `./src/config/env.validator.ts` |
| `-r, --required <vars...>` | Required environment variables | `[]` |
| `-p, --parse-types` | Parse and infer types from values | `false` |
| `-t, --strict` | Treat all variables as required | `false` |
| `-w, --watch` | Watch mode - regenerate on file changes | `false` |
| `-c, --config <path>` | Path to config file | - |

### Examples

#### Basic Usage

```bash
# Generate types from .env
npx env-type-gen

# Specify custom output path
npx env-type-gen --output ./types/env.d.ts

# Parse multiple env files
npx env-type-gen --env-files .env .env.local
```

#### With Type Inference

```bash
# Enable type inference (string → number, boolean, etc.)
npx env-type-gen --parse-types
```

This will generate:

```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string | undefined;
    DATABASE_POOL_SIZE?: number | undefined;  // ← Inferred as number
    ENABLE_ANALYTICS?: boolean | undefined;    // ← Inferred as boolean
  }
}
```

#### With Zod Validation

```bash
# Generate Zod validation schema
npx env-type-gen --validation-lib zod --parse-types
```

This generates `env.validator.ts`:

```typescript
import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_SIZE: z.string().transform((val) => Number(val)).optional(),
  ENABLE_ANALYTICS: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
```

#### With Required Variables

```bash
# Mark specific variables as required
npx env-type-gen --required DATABASE_URL STRIPE_SECRET_KEY

# Or mark ALL variables as required (strict mode)
npx env-type-gen --strict
```

#### Watch Mode

```bash
# Auto-regenerate on file changes
npx env-type-gen --watch
```

### Configuration File

Create `env-type.config.js`:

```javascript
module.exports = {
  envFiles: ['.env', '.env.local'],
  outputPath: './src/types/env.d.ts',
  validationLib: 'zod',
  validationOutput: './src/config/env.validator.ts',
  requiredVars: ['DATABASE_URL', 'API_KEY'],
  parseTypes: true,
  strict: false,
};
```

Then run:

```bash
npx env-type-gen --config env-type.config.js
```

### Programmatic API

```typescript
import { GeneratorService } from '@kitiumai/env-type-generator';

const service = new GeneratorService();

await service.generate({
  envFiles: ['.env'],
  outputPath: './types/env.d.ts',
  parseTypes: true,
  validationLib: 'zod',
  validationOutput: './config/env.validator.ts',
});
```

## 🎨 Framework Integration

### Next.js

```bash
# Generate types
npx env-type-gen --env-files .env.local .env --parse-types

# Add to package.json
{
  "scripts": {
    "dev": "env-type-gen && next dev",
    "build": "env-type-gen && next build"
  }
}
```

### Vite

```bash
# Generate types
npx env-type-gen --parse-types

# Add to package.json
{
  "scripts": {
    "dev": "env-type-gen && vite",
    "build": "env-type-gen && vite build"
  }
}
```

### Node.js / Express

```bash
# Generate with Zod validation
npx env-type-gen --validation-lib zod --parse-types --strict

# Use in your app
import { env } from './config/env.validator';

const app = express();
app.listen(env.PORT); // Type-safe!
```

## 📝 Generated Output Examples

### Without Type Parsing

Input (`.env`):
```env
DATABASE_URL=postgresql://localhost:5432/mydb
PORT=3000
```

Output (`env.d.ts`):
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string | undefined;
    PORT?: string | undefined;
  }
}

export declare const env: {
  DATABASE_URL?: string;
  PORT?: string;
};
```

### With Type Parsing

Input (`.env`):
```env
DATABASE_URL=postgresql://localhost:5432/mydb
PORT=3000
ENABLE_DEBUG=true
CONFIG={"key":"value"}
```

Output (`env.d.ts`):
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string | undefined;
    PORT?: number | undefined;
    ENABLE_DEBUG?: boolean | undefined;
    CONFIG?: object | undefined;
  }
}

export declare const env: {
  DATABASE_URL?: string;
  PORT?: number;
  ENABLE_DEBUG?: boolean;
  CONFIG?: object;
};
```

### With Comments

Input (`.env`):
```env
# Database connection string
DATABASE_URL=postgresql://localhost:5432/mydb

# Maximum number of connections
DATABASE_POOL_SIZE=10
```

Output (`env.d.ts`):
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    /** Database connection string */
    DATABASE_URL?: string | undefined;

    /** Maximum number of connections */
    DATABASE_POOL_SIZE?: number | undefined;
  }
}
```

## TypeScript Configuration

Add the generated types to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["node"],
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*", "src/types/env.d.ts"]
}
```

## GitHub Actions

This repository includes comprehensive CI/CD workflows:

### CI Workflow
Runs on every push and pull request to main/master branch:
- **Linting**: ESLint and Prettier checks
- **Type Checking**: TypeScript compilation
- **Testing**: Multi-version tests (Node 16, 18, 20) across OS (Ubuntu, Windows, macOS)
- **Build**: Ensures project builds successfully
- **Integration Tests**: End-to-end CLI testing with type generation and validation

### Publish Workflow
Automatically publishes to npm on GitHub releases:
- Runs all quality checks
- Publishes with npm provenance for enhanced security
- Creates deployment summary

### Security Workflows
- **CodeQL**: Weekly security scans for vulnerabilities
- **Dependency Review**: Automated review on pull requests

### Adding to Your Project

Add similar CI/CD to your project using env-type-generator:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx env-type-gen --parse-types
      - run: npm test
```

## Comparison with Other Tools

| Feature | env-type-generator | t3-env | envalid | ts-dotenv |
|---------|-------------------|--------|---------|-----------|
| Auto-generate from .env | ✅ | ❌ | ❌ | ❌ |
| Zero config | ✅ | ❌ | ❌ | ❌ |
| Type inference | ✅ | ⚠️ | ⚠️ | ✅ |
| Runtime validation | ✅ | ✅ | ✅ | ✅ |
| Framework-agnostic | ✅ | ❌ | ✅ | ✅ |
| Watch mode | ✅ | ❌ | ❌ | ❌ |
| Active maintenance | ✅ | ✅ | ✅ | ❌ |
| Weekly downloads | TBD | 501K | 200K | 3.6K |

**Key Advantage**: We're the only tool that auto-generates types from existing .env files without requiring manual schema definition.

## 🛠️ Troubleshooting

### Types not updating in IDE

1. Restart TypeScript server: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
2. Ensure `env.d.ts` is included in `tsconfig.json`

### Variables not being recognized

1. Check that your .env file uses valid variable names (UPPERCASE_WITH_UNDERSCORES)
2. Regenerate types: `npx env-type-gen`
3. Verify output path matches your tsconfig includes

### Watch mode not working

1. Ensure you have write permissions in the output directory
2. Check that the .env file path is correct
3. Try using absolute paths instead of relative paths

## Best Practices

1. **Add to git ignore**: Add generated files to `.gitignore`
   ```gitignore
   src/types/env.d.ts
   src/config/env.validator.ts
   ```

2. **Generate in pre-build**: Add to your build pipeline
   ```json
   {
     "scripts": {
       "prebuild": "env-type-gen",
       "build": "tsc"
     }
   }
   ```

3. **Use strict mode in production**: Catch missing vars early
   ```bash
   env-type-gen --strict --required DATABASE_URL API_KEY
   ```

4. **Combine with dotenv-expand**: For variable interpolation
   ```env
   BASE_URL=https://api.example.com
   API_ENDPOINT=${BASE_URL}/v1
   ```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [kitium-ai](https://github.com/kitium-ai)

## Acknowledgments

- Inspired by [t3-env](https://env.t3.gg/) and [envalid](https://github.com/af/envalid)
- Built with TypeScript, Commander, Chokidar, and Zod

## Support

-  [Report issues](https://github.com/kitium-ai/env-type-generator/issues)
-  [Discussions](https://github.com/kitium-ai/env-type-generator/discussions)
-  [Star on GitHub](https://github.com/kitium-ai/env-type-generator)

---

**Made with ❤️ for the TypeScript community**