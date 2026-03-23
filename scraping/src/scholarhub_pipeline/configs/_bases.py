"""Base config classes implementing the SourceConfig protocol.

Provides sensible defaults so individual source configs
only need to override what's unique to them.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class BaseSourceConfig:
    """Base config with sensible defaults for all source types."""

    name: str
    url: str
    source_id: str
    primary_method: str
    selectors: dict[str, str] = field(default_factory=dict)
    field_mappings: dict[str, str] = field(default_factory=dict)
    secondary_method: str | None = None
    pagination: dict | None = None
    detail_page: bool = False
    detail_selectors: dict[str, str] | None = None
    auth_config: dict | None = None
    rate_limit_delay: float = 2.0
    cutoff_months: int = 3
    max_records: int | None = None
    incremental_mode: bool = False
    incremental_max_pages: int = 3
    incremental_skip_detail: bool = True


@dataclass
class BaseAggregatorConfig(BaseSourceConfig):
    """Config for aggregator sources (designed for traffic)."""

    rate_limit_delay: float = 1.5


@dataclass
class BaseOfficialConfig(BaseSourceConfig):
    """Config for official program sources (be more respectful)."""

    rate_limit_delay: float = 3.0


@dataclass
class BaseGovernmentConfig(BaseSourceConfig):
    """Config for government sources."""

    rate_limit_delay: float = 3.0


@dataclass
class BaseFoundationConfig(BaseSourceConfig):
    """Config for foundation sources."""

    rate_limit_delay: float = 2.5
