import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple

from .config import Config, VariableDefinition

LOGGER = logging.getLogger(__name__)


def _parse_bool(value: str) -> bool:
    return value.lower() in {"true", "1", "yes", "y", "on"}


def _parse_value(value: str, definition: VariableDefinition):
    if definition.type == "string":
        return value
    if definition.type == "number":
        return float(value)
    if definition.type == "boolean":
        return _parse_bool(value)
    if definition.type == "enum":
        if definition.enum and value not in definition.enum:
            raise ValueError(f"Value '{value}' not allowed; expected one of {definition.enum}.")
        return value
    if definition.type == "url":
        if not (value.startswith("http://") or value.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return value
    if definition.type == "duration":
        if value.endswith("s"):
            return float(value[:-1])
        return float(value)
    if definition.type == "json":
        return json.loads(value)
    return value


def load_env_file(path: Path) -> Dict[str, str]:
    data: Dict[str, str] = {}
    if not path.exists():
        return data
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            data[key.strip()] = value.strip()
    return data


def validate_env(config: Config, env_name: str, env_file: Path) -> List[str]:
    errors: List[str] = []
    declared = {v.name: v for v in config.environments.get(env_name, [])}
    provided = load_env_file(env_file)

    for name, definition in declared.items():
        if name not in provided:
            if definition.required and definition.default is None:
                errors.append(f"[{env_name}] missing required variable '{name}' in {env_file}")
            continue
        try:
            _parse_value(provided[name], definition)
        except Exception as exc:
            errors.append(f"[{env_name}] variable '{name}' invalid: {exc}")

    extra = set(provided.keys()) - set(declared.keys())
    for name in sorted(extra):
        errors.append(f"[{env_name}] extra variable '{name}' present in {env_file}")
    return errors


def validate_schema(config: Config) -> Tuple[bool, List[str]]:
    errors = config.validate()
    return not errors, errors


def diff_environments(config: Config, left_env: str, right_env: str) -> List[str]:
    left = {v.name: v for v in config.environments.get(left_env, [])}
    right = {v.name: v for v in config.environments.get(right_env, [])}

    errors: List[str] = []
    missing_in_right = sorted(set(left.keys()) - set(right.keys()))
    missing_in_left = sorted(set(right.keys()) - set(left.keys()))

    for name in missing_in_right:
        errors.append(f"Variable '{name}' declared in {left_env} but missing in {right_env}.")
    for name in missing_in_left:
        errors.append(f"Variable '{name}' declared in {right_env} but missing in {left_env}.")
    return errors
