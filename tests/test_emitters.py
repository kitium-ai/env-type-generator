from pathlib import Path

from env_type_generator.config import load_config
from env_type_generator.emitter_ts import TypeScriptEmitter
from env_type_generator.emitter_go import GoEmitter
from env_type_generator.emitter_py import PythonEmitter


def test_typescript_emitter_matches_golden(tmp_path):
    config = load_config(Path("tests/data/envtypes.config.json"))
    out_dir = tmp_path / "ts"
    TypeScriptEmitter().emit(config.environments["development"], out_dir)
    assert (out_dir / "env.ts").read_text() == (Path("tests/golden/ts/env.ts").read_text())


def test_go_emitter_matches_golden(tmp_path):
    config = load_config(Path("tests/data/envtypes.config.json"))
    out_dir = tmp_path / "go"
    GoEmitter().emit(config.environments["development"], out_dir)
    assert (out_dir / "env.go").read_text() == (Path("tests/golden/go/env.go").read_text())


def test_python_emitter_matches_golden(tmp_path):
    config = load_config(Path("tests/data/envtypes.config.json"))
    out_dir = tmp_path / "python"
    PythonEmitter().emit(config.environments["development"], out_dir)
    assert (out_dir / "env.py").read_text() == (Path("tests/golden/python/env.py").read_text())
