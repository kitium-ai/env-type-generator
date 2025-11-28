from pathlib import Path

from env_type_generator.config import load_config
from env_type_generator.validation import validate_env, validate_schema, diff_environments


def test_schema_validation_passes():
    config = load_config(Path("tests/data/envtypes.config.json"))
    ok, errors = validate_schema(config)
    assert ok
    assert errors == []


def test_missing_required_variable_errors():
    config = load_config(Path("tests/data/envtypes.config.json"))
    errors = validate_env(config, "development", Path("tests/data/.env.missing"))
    assert any("missing required variable 'FEATURE'" in err for err in errors)


def test_drift_detection():
    config = load_config(Path("tests/data/envtypes.config.json"))
    drift = diff_environments(config, "development", "production")
    assert drift == []
