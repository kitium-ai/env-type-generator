import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Any

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover
    yaml = None


SUPPORTED_TYPES = {"string", "number", "boolean", "enum", "url", "duration", "json"}


@dataclass
class VariableDefinition:
    name: str
    type: str
    required: bool = True
    default: Optional[Any] = None
    description: Optional[str] = None
    secret: bool = False
    deprecated: bool = False
    enum: Optional[List[str]] = None

    def validate(self, errors: List[str], env_name: str) -> None:
        if self.type not in SUPPORTED_TYPES:
            errors.append(f"[{env_name}] variable '{self.name}' uses unsupported type '{self.type}'.")
        if self.type == "enum" and not self.enum:
            errors.append(f"[{env_name}] variable '{self.name}' is enum but enum values are empty.")
        if self.default is not None and self.required:
            errors.append(
                f"[{env_name}] variable '{self.name}' is marked required but also provides a default; choose one."
            )


@dataclass
class TargetDefinition:
    language: str
    out_dir: str


@dataclass
class Config:
    schema_version: str
    environments: Dict[str, List[VariableDefinition]]
    targets: List[TargetDefinition]

    def validate(self) -> List[str]:
        errors: List[str] = []
        for env, variables in self.environments.items():
            names = set()
            for var in variables:
                if var.name in names:
                    errors.append(f"[{env}] variable '{var.name}' is declared more than once.")
                names.add(var.name)
                var.validate(errors, env)
        if not self.targets:
            errors.append("At least one generation target must be defined.")
        return errors


def _load_raw_config(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    if path.suffix in {".yaml", ".yml"}:
        if yaml is None:
            raise RuntimeError("PyYAML is required to load YAML configs. Install via pip install pyyaml.")
        with path.open("r", encoding="utf-8") as handle:
            return yaml.safe_load(handle)
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _coerce_variable(raw: Dict[str, Any]) -> VariableDefinition:
    return VariableDefinition(
        name=raw["name"],
        type=raw.get("type", "string"),
        required=raw.get("required", True),
        default=raw.get("default"),
        description=raw.get("description"),
        secret=raw.get("secret", False),
        deprecated=raw.get("deprecated", False),
        enum=raw.get("enum"),
    )


def _coerce_target(raw: Dict[str, Any]) -> TargetDefinition:
    return TargetDefinition(language=raw["language"], out_dir=raw.get("outDir", "generated"))


def load_config(path: Path) -> Config:
    raw = _load_raw_config(path)
    if not isinstance(raw, dict):
        raise ValueError("Config must be a JSON or YAML object.")
    schema_version = raw.get("schemaVersion", "0.1")
    envs_raw = raw.get("environments") or {}
    targets_raw = raw.get("targets") or []
    environments: Dict[str, List[VariableDefinition]] = {}
    for env_name, values in envs_raw.items():
        environments[env_name] = [_coerce_variable(item) for item in values]
    targets = [_coerce_target(item) for item in targets_raw]
    return Config(schema_version=schema_version, environments=environments, targets=targets)
