import argparse
import json
import logging
from pathlib import Path

from .config import load_config
from .validation import validate_env, validate_schema, diff_environments
from .emitter_ts import TypeScriptEmitter
from .emitter_go import GoEmitter
from .emitter_py import PythonEmitter

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


EMITTERS = {
    "ts": TypeScriptEmitter(),
    "go": GoEmitter(),
    "python": PythonEmitter(),
}


TEMPLATE_CONFIG = {
    "schemaVersion": "0.1",
    "environments": {
        "development": [
            {"name": "API_URL", "type": "url", "required": True},
            {"name": "FEATURE_FLAG", "type": "boolean", "required": False, "default": "false"},
        ],
        "production": [
            {"name": "API_URL", "type": "url", "required": True},
            {"name": "FEATURE_FLAG", "type": "boolean", "required": False, "default": "false"},
        ],
    },
    "targets": [
        {"language": "ts", "outDir": "generated/ts"},
        {"language": "go", "outDir": "generated/go"},
        {"language": "python", "outDir": "generated/python"},
    ],
}


def init_command(args: argparse.Namespace) -> None:
    config_path = Path(args.path)
    config_path.write_text(json.dumps(TEMPLATE_CONFIG, indent=2), encoding="utf-8")
    for env_name in TEMPLATE_CONFIG["environments"]:
        env_file = Path(f".env.{env_name}")
        if not env_file.exists():
            env_file.write_text("# populate environment variables here\n", encoding="utf-8")
    gitignore = Path(".gitignore")
    content = gitignore.read_text(encoding="utf-8") if gitignore.exists() else ""
    for item in [".env.*", "generated"]:
        if item not in content:
            content += f"\n{item}"
    gitignore.write_text(content.strip() + "\n", encoding="utf-8")
    LOGGER.info("Initialized envtypes.config.json and .env templates.")


def validate_command(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    ok, schema_errors = validate_schema(config)
    errors = schema_errors
    if not ok:
        LOGGER.error("Schema validation failed")
    env_file = Path(args.env)
    env_name = args.environment
    errors.extend(validate_env(config, env_name, env_file))
    for err in errors:
        LOGGER.error(err)
    if args.drift_with:
        drift = diff_environments(config, env_name, args.drift_with)
        for err in drift:
            LOGGER.error(err)
            errors.append(err)
    return 0 if not errors else 1


def generate_command(args: argparse.Namespace) -> None:
    config = load_config(Path(args.config))
    for target in config.targets:
        emitter = EMITTERS.get(target.language)
        if not emitter:
            LOGGER.warning("Skipping unsupported target %s", target.language)
            continue
        emitter.emit(config.environments.get(args.environment, []), Path(target.out_dir))
        LOGGER.info("Generated %s artifacts in %s", target.language, target.out_dir)


def doctor_command(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    ok, schema_errors = validate_schema(config)
    if ok:
        LOGGER.info("Config schema looks good.")
    for err in schema_errors:
        LOGGER.error(err)
    return 0 if ok else 1


def telemetry_note(args: argparse.Namespace) -> None:
    LOGGER.info("Telemetry is opt-in. Set ENV_TYPES_TELEMETRY=1 to emit anonymous usage counts.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="env-type-generator CLI")
    sub = parser.add_subparsers(dest="command")

    init_p = sub.add_parser("init", help="Scaffold config and env templates")
    init_p.add_argument("--path", default="envtypes.config.json")
    init_p.set_defaults(func=init_command)

    val_p = sub.add_parser("validate", help="Validate env file against schema")
    val_p.add_argument("--config", default="envtypes.config.json")
    val_p.add_argument("--env", default=".env.development")
    val_p.add_argument("--environment", default="development")
    val_p.add_argument("--drift-with", dest="drift_with")
    val_p.set_defaults(func=validate_command)

    gen_p = sub.add_parser("generate", help="Generate typed bindings")
    gen_p.add_argument("--config", default="envtypes.config.json")
    gen_p.add_argument("--environment", default="development")
    gen_p.set_defaults(func=generate_command)

    doc_p = sub.add_parser("doctor", help="Check configuration health")
    doc_p.add_argument("--config", default="envtypes.config.json")
    doc_p.set_defaults(func=doctor_command)

    tel_p = sub.add_parser("telemetry", help="Describe telemetry controls")
    tel_p.set_defaults(func=telemetry_note)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not hasattr(args, "func"):
        parser.print_help()
        return 1
    result = args.func(args)
    return result or 0


if __name__ == "__main__":
    raise SystemExit(main())
