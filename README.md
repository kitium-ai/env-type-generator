# env-type-generator

`env-type-generator` provides a simplified CLI and emitters for generating typed environment bindings across languages. It ships with validation, drift detection, and deterministic outputs inspired by big-tech production practices.

## Features
- Schema-first config (`envtypes.config.json` or YAML) with supported types (`string`, `number`, `boolean`, `enum`, `url`, `duration`, `json`).
- CLI commands: `init`, `validate`, `generate`, `doctor`, and `telemetry`.
- Generators for TypeScript (Zod), Go structs, and Python (Pydantic) with golden tests.
- Drift detection between environments and opt-in telemetry messaging.
- Secret hygiene via `.gitignore` scaffolding and an auditable log helper.

## Quickstart
1. Initialize the project.
   ```bash
   python -m env_type_generator.cli init
   ```
2. Populate `.env.development` and `.env.production` files.
3. Validate your configuration and environment file.
   ```bash
   python -m env_type_generator.cli validate --env .env.development --environment development
   ```
4. Generate typed bindings.
   ```bash
   python -m env_type_generator.cli generate --environment development
   ```
5. Import generated helpers (examples):
   - TypeScript: `import { loadEnv } from './generated/ts/env';`
   - Go: `cfg := env.Config{}` then `errs := cfg.Validate()`.
   - Python: `from generated.python.env import load_env`.

## Configuration Schema
Minimal config example (`envtypes.config.json`):
```json
{
  "schemaVersion": "0.1",
  "environments": {
    "development": [
      { "name": "API_URL", "type": "url", "required": true },
      { "name": "TIMEOUT", "type": "duration", "default": "10s", "required": false },
      { "name": "FEATURE", "type": "enum", "enum": ["on", "off"] }
    ]
  },
  "targets": [
    { "language": "ts", "outDir": "generated/ts" },
    { "language": "go", "outDir": "generated/go" },
    { "language": "python", "outDir": "generated/python" }
  ]
}
```

## CLI Reference
| Command | Purpose |
| --- | --- |
| `init` | Scaffold config and sample `.env.*` files with `.gitignore` hints. |
| `validate` | Validate config and a specific `.env` file; optionally `--drift-with` another environment. |
| `generate` | Emit typed bindings for configured targets for a given environment. |
| `doctor` | Run schema checks without processing env files. |
| `telemetry` | Describe opt-in telemetry controls. |

## Development
Run tests with pytest:
```bash
pytest
```

## Telemetry and Secrets
Telemetry is opt-in via `ENV_TYPES_TELEMETRY=1`. The provided `FileSecretProvider` and `AuditLogger` illustrate how to layer in secret retrieval and audit trails without exposing secret values.
