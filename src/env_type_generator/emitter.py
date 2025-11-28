from abc import ABC, abstractmethod
from pathlib import Path
from typing import Iterable

from .config import VariableDefinition


class Emitter(ABC):
    language: str

    @abstractmethod
    def emit(self, variables: Iterable[VariableDefinition], output_dir: Path) -> None:  # pragma: no cover
        ...


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
