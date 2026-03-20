"""SourceConfig protocol definition.

All source config modules must export a CONFIG attribute
that satisfies this protocol.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class SourceConfig(Protocol):
    """Protocol all source configs must implement."""

    name: str
    """Human-readable name matching catalog."""

    url: str
    """Base URL of the source."""

    source_id: str
    """Matches catalog entry name (slug form)."""

    primary_method: str
    """Primary scraping method: api, jsonld, ajax, rss, scrape, scrapling."""

    secondary_method: str | None
    """Fallback method (explicit per source)."""

    selectors: dict[str, str]
    """CSS/XPath selectors for data extraction."""

    field_mappings: dict[str, str]
    """Maps extracted fields to raw_record schema."""

    pagination: dict | None
    """Pagination config: {"type": "url"|"cursor"|"page_num", "selector": "...", "max_pages": N}."""

    detail_page: bool
    """Whether to follow links for full data."""

    detail_selectors: dict[str, str] | None
    """Selectors for detail pages."""

    auth_config: dict | None
    """Future: auth credentials (None in v1)."""

    rate_limit_delay: float
    """Seconds between requests (per source)."""

    cutoff_months: int
    """Stop paginating after this many months expired (default 3)."""
