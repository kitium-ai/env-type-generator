# Examples

This directory documents a minimal multi-language walkthrough. Generated artifacts are written to `generated/`.

1. Run `python -m env_type_generator.cli init`.
2. Populate `.env.development` with values for `API_URL` and `FEATURE_FLAG`.
3. Run `python -m env_type_generator.cli validate --env .env.development --environment development` to see validation errors or success.
4. Run `python -m env_type_generator.cli generate --environment development` to create TypeScript, Go, and Python helpers.
5. Import them in your application:
   - TypeScript: `import { loadEnv } from './generated/ts/env'`.
   - Go: `cfg := env.Config{}` and `cfg.Validate()`.
   - Python: `from generated.python.env import load_env`.
