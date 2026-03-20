"""Source config discovery and loading.

Each source config module should export a CONFIG attribute
that satisfies the SourceConfig protocol.
"""

from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scholarhub_pipeline.configs._protocol import SourceConfig


def discover_configs() -> list[SourceConfig]:
    """Scan configs directory, import all modules implementing SourceConfig.

    Skips private modules (those starting with underscore).
    Each config module must export a CONFIG attribute.

    Returns:
        List of SourceConfig instances found in the configs package.
    """
    configs: list[SourceConfig] = []
    package_dir = Path(__file__).parent
    for _importer, modname, _ispkg in pkgutil.iter_modules([str(package_dir)]):
        if modname.startswith("_"):
            continue
        module = importlib.import_module(f".{modname}", package=__name__)
        if hasattr(module, "CONFIG"):
            configs.append(module.CONFIG)
    return configs
