import json
import logging
from pathlib import Path
from typing import Protocol, Dict, Any

LOGGER = logging.getLogger(__name__)


class SecretProvider(Protocol):  # pragma: no cover
    def get_secret(self, key: str) -> str:
        ...


class FileSecretProvider:
    """Reads secrets from a JSON file for demo purposes."""

    def __init__(self, path: Path):
        self.path = path

    def get_secret(self, key: str) -> str:
        data = json.loads(self.path.read_text(encoding="utf-8"))
        return data[key]


class AuditLogger:
    def __init__(self, path: Path):
        self.path = path

    def record(self, event: str, metadata: Dict[str, Any]) -> None:
        line = json.dumps({"event": event, "metadata": metadata})
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
        LOGGER.debug("Audit event: %s", line)
